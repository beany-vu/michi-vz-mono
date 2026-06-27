import { describe, it, expect } from "vitest";
import { narrateRules, explainChart, narrate } from "../src/narrate";
import type { LineChartContext } from "@michi-vz/core";

const lineCtx: LineChartContext = {
  chartType: "line-chart",
  renderer: "svg",
  xAxis: { type: "number", domain: [0, 3] },
  yAxis: { domain: [0, 50] },
  series: [
    { label: "A", color: "", pointCount: 4, first: { x: 0, y: 10 }, last: { x: 3, y: 40 }, min: 10, max: 40, mean: 25, change: 30, changePct: 300, trend: "up", gaps: 0 },
    { label: "B", color: "", pointCount: 4, first: { x: 0, y: 20 }, last: { x: 3, y: 8 }, min: 8, max: 20, mean: 14, change: -12, changePct: -60, trend: "down", gaps: 0 },
  ],
  stats: { seriesCount: 2, pointCount: 8, largestMover: { label: "A", change: 30 }, valueRange: [0, 50] },
  colorsMapping: {},
  summary: "Line chart with 2 series.",
  a11yTable: { headers: [], rows: [] },
};

describe("narrate", () => {
  it("narrateRules adds top-mover + trend detail deterministically", () => {
    const text = narrateRules(lineCtx);
    expect(text).toContain("Line chart with 2 series.");
    expect(text).toContain("A rose the most (+300%).");
    expect(text).toContain("1 series trended up and 1 down.");
  });

  it("explainChart rules backend equals narrateRules", async () => {
    expect(await explainChart(lineCtx, { backend: "rules" })).toBe(narrateRules(lineCtx));
  });

  it("remote backend uses the caller and falls back on failure", async () => {
    expect(await explainChart(lineCtx, { backend: "remote", caller: async () => "Custom explanation." })).toBe(
      "Custom explanation."
    );
    expect(
      await explainChart(lineCtx, {
        backend: "remote",
        caller: async () => {
          throw new Error("backend down");
        },
      })
    ).toBe(narrateRules(lineCtx));
    expect(await explainChart(lineCtx, { backend: "remote" })).toBe(narrateRules(lineCtx)); // no caller
  });

  it("transformers backend falls back to rules when the dep is absent", async () => {
    expect(await explainChart(lineCtx, { backend: "transformers" })).toBe(narrateRules(lineCtx));
  });

  it("narrate() plugin rewrites the summary", () => {
    const out = narrate().enrichContext!(lineCtx, {} as never);
    expect(out.summary).toContain("A rose the most");
  });
});
