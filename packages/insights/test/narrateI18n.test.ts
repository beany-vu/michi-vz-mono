import { describe, it, expect } from "vitest";
import { narrate, narrateRules, explainChart, type NarrateStrings } from "../src/narrate";
import type { LineChartContext } from "@michi-vz/core";

const ctx: LineChartContext = {
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
  summary: "Résumé.",
  a11yTable: { headers: [], rows: [] },
};

// French phrase builders — i18n by overriding the fragments.
const fr: NarrateStrings = {
  topMover: (label, dir, pct) => `${label} a ${dir === "rose" ? "le plus augmenté" : dir === "fell" ? "le plus baissé" : "stagné"}${pct}.`,
  trendSplit: (up, down) => `${up} séries en hausse et ${down} en baisse.`,
};

describe("narrate customization + i18n", () => {
  it("narrateRules honours localized strings", () => {
    const text = narrateRules(ctx, fr);
    expect(text).toContain("A a le plus augmenté (+300%).");
    expect(text).toContain("1 séries en hausse et 1 en baisse.");
  });

  it("narrate({ strings }) localizes the plugin summary", () => {
    const out = narrate({ strings: fr }).enrichContext!(ctx, {} as never) as { summary: string };
    expect(out.summary).toContain("le plus augmenté");
  });

  it("narrate({ render }) fully replaces the narration", () => {
    const out = narrate({ render: (c) => `[custom] ${c.chartType}` }).enrichContext!(ctx, {} as never) as { summary: string };
    expect(out.summary).toBe("[custom] line-chart");
  });

  it("explainChart rules fallback honours strings/render", async () => {
    expect(await explainChart(ctx, { backend: "rules", strings: fr })).toContain("le plus augmenté");
    expect(await explainChart(ctx, { backend: "transformers", render: () => "RENDERED" })).toBe("RENDERED"); // dep absent → fallback to render
  });
});
