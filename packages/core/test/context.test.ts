// Phase 2 — generalized ChartContext schema (TDD, written before the impl).
// Drives: a shared BaseChartContext with a chart-agnostic `a11yTable`, a
// discriminated union keyed on `chartType`, and an a11y mirror that renders from
// the base (no gap-specific fields) so every future chart reuses it.
import { describe, it, expect } from "vitest";
import { buildGapContext } from "../src/context/buildContext";
import { renderA11yMirror } from "../src/context/a11yMirror";
import { processGapChartData } from "../src/gapChart/data";
import type { BaseChartContext, GapDataItem } from "../src/types";

const sample: GapDataItem[] = [
  { label: "Alpha One", value1: 10, value2: 30, difference: -20 },
  { label: "Beta", value1: 50, value2: 20, difference: 30 },
];

function gapCtx(extra: { renderer?: "svg" | "canvas"; title?: string } = {}) {
  const r = processGapChartData(sample, undefined, []);
  return buildGapContext({
    title: extra.title,
    renderer: extra.renderer ?? "svg",
    xAxisDataType: "number",
    xAxisDomain: r.xAxisDomain,
    processedDataSet: r.processedDataSet,
    colorsMapping: {},
  });
}

describe("ChartContext base contract", () => {
  it("carries a chart-agnostic a11yTable (headers + one row per series)", () => {
    const ctx = gapCtx({ title: "Demo" });
    expect(ctx.a11yTable.headers).toEqual(["Label", "Value 1", "Value 2", "Difference", "Gap"]);
    expect(ctx.a11yTable.rows.length).toBe(2);
    // every row matches header arity (table stays well-formed for screen readers)
    for (const row of ctx.a11yTable.rows) {
      expect(row.length).toBe(ctx.a11yTable.headers.length);
    }
  });

  it("exposes the shared base fields on every context", () => {
    const ctx = gapCtx();
    const base: BaseChartContext = ctx; // must be assignable to the base
    expect(base.chartType).toBe("gap-chart");
    expect(typeof base.summary).toBe("string");
    expect(base.renderer).toBe("svg");
    expect(base.colorsMapping).toEqual({});
  });

  it("discriminates by chartType so gap-only fields narrow cleanly", () => {
    const ctx = gapCtx();
    if (ctx.chartType === "gap-chart") {
      expect(ctx.series.length).toBe(2);
      expect(ctx.stats.maxGap).toEqual({ label: "Beta", value: 30 });
    } else {
      throw new Error("expected gap-chart discriminant");
    }
  });
});

describe("renderA11yMirror (chart-agnostic)", () => {
  it("renders summary + table from a11yTable for ANY chart context", () => {
    const host = document.createElement("div");
    // A non-gap context: proves the mirror no longer depends on gap `series`.
    const fake: BaseChartContext = {
      chartType: "fake-chart",
      renderer: "svg",
      colorsMapping: {},
      summary: "A fake chart for testing.",
      a11yTable: { headers: ["X", "Y"], rows: [[1, 2], [3, 4], [5, 6]] },
    };
    renderA11yMirror(host, fake);
    expect(host.getAttribute("aria-label")).toBe("A fake chart for testing.");
    expect(host.querySelectorAll("table thead th").length).toBe(2);
    expect(host.querySelectorAll("table tbody tr").length).toBe(3);
    expect(host.querySelector("table tbody tr td")!.textContent).toBe("1");
  });
});
