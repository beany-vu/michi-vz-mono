import { describe, it, expect } from "vitest";
import { renderA11yMirror, MAX_A11Y_ROWS } from "../src/context/a11yMirror";
import type { BaseChartContext } from "../src/types";

// A screen reader (and the browser) cannot handle a table with one row per point on
// a heavy dataset - renderA11yMirror must cap the DOM rows and note the remainder.
function ctxWith(n: number): BaseChartContext {
  const rows = Array.from({ length: n }, (_, i) => [`Row ${i}`, String(i)]);
  return {
    chartType: "scatter-plot-chart",
    renderer: "canvas",
    colorsMapping: {},
    summary: "a summary",
    a11yTable: { headers: ["label", "x"], rows },
  } as unknown as BaseChartContext;
}

describe("renderA11yMirror row cap", () => {
  it("renders every row when under the cap (small charts unaffected)", () => {
    const host = document.createElement("div");
    renderA11yMirror(host, ctxWith(10));
    expect(host.querySelectorAll("table tbody tr").length).toBe(10);
    expect(host.querySelector(".mv-a11y-more")).toBeNull();
  });

  it("caps the DOM rows and appends a truncation note for large datasets", () => {
    const host = document.createElement("div");
    renderA11yMirror(host, ctxWith(50000));
    const trs = host.querySelectorAll("table tbody tr");
    // MAX sample rows + 1 truncation-note row (never 50k DOM rows).
    expect(trs.length).toBe(MAX_A11Y_ROWS + 1);
    const more = host.querySelector(".mv-a11y-more");
    expect(more).not.toBeNull();
    expect(more!.textContent).toContain(String(50000 - MAX_A11Y_ROWS));
  });

  it("keeps the full data available on the context (only the DOM is capped)", () => {
    // The cap is a render-layer concern; the context still carries every row for
    // consumers that want them (getContext()), so this is purely a DOM guard.
    const ctx = ctxWith(50000);
    expect(ctx.a11yTable.rows.length).toBe(50000);
  });
});
