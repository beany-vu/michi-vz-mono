import { describe, it, expect } from "vitest";
import { narrateRules, explainChart, narrate } from "../src/narrate";
import type {
  LineChartContext,
  TreemapChartContext,
  PieChartContext,
  BubbleChartContext,
  SankeyChartContext,
} from "@michi-vz/core";

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

  // The treemap is a non-time-series chart, so forecast/anomaly don't apply - but it
  // IS a first-class insight via the generic narrate/explain path (its rich summary
  // carries the realized/untapped headline + biggest opportunity).
  it("narrates a treemap from its summary (insight coverage)", async () => {
    const treemapCtx: TreemapChartContext = {
      chartType: "treemap-chart",
      renderer: "svg",
      layout: "squarify",
      splitLabels: ["Realized", "Untapped"],
      leaves: [],
      depth: 2,
      stats: {
        leafCount: 3,
        grandTotal: 300,
        totalPartial: 120,
        totalRemainder: 180,
        largestLeaf: { label: "Machinery", value: 120 },
        largestRemainder: { label: "Fruits", remainder: 66 },
      },
      colorsMapping: {},
      summary:
        "Treemap with 3 tiles across 2 groups. Largest: Machinery (120). Realized 120 of 300 (40%); Untapped 180. Biggest untapped: Fruits (66).",
      a11yTable: { headers: ["Label", "Value", "Realized", "Untapped", "%"], rows: [] },
    };
    const text = narrateRules(treemapCtx);
    expect(text).toContain("Untapped");
    expect(text).toContain("Biggest untapped: Fruits");
    expect(await explainChart(treemapCtx, { backend: "rules" })).toBe(text);
  });

  it("narrates a pie/donut from its summary (insight coverage)", async () => {
    const pieCtx: PieChartContext = {
      chartType: "pie-chart",
      renderer: "svg",
      mode: "donut",
      innerRadiusRatio: 0.6,
      slices: [],
      stats: { sliceCount: 5, total: 899, largestSlice: { label: "Agri-food", value: 381, share: 0.42 } },
      colorsMapping: {},
      summary: "Donut chart with 5 slices totalling 899. Largest: Agri-food (42%).",
      a11yTable: { headers: ["Label", "Value", "Share"], rows: [] },
    };
    const text = narrateRules(pieCtx);
    expect(text).toContain("Donut chart");
    expect(text).toContain("Agri-food");
    expect(await explainChart(pieCtx, { backend: "rules" })).toBe(text);
  });

  it("narrates a bubble chart from its summary (insight coverage)", async () => {
    const bubbleCtx: BubbleChartContext = {
      chartType: "bubble-chart",
      renderer: "svg",
      splitLabels: ["Realized", "Untapped"],
      bubbles: [],
      stats: {
        bubbleCount: 3,
        total: 440,
        totalPartial: 203,
        totalRemainder: 237,
        largestBubble: { label: "China", value: 168 },
        largestRemainder: { label: "China", remainder: 117 },
      },
      colorsMapping: {},
      summary:
        "Bubble chart with 3 bubbles totalling 440. Largest: China (168). Realized 203 of 440 (46%); Untapped 237. Biggest untapped: China (117).",
      a11yTable: { headers: ["Label", "Value", "Realized", "Untapped", "%"], rows: [] },
    };
    const text = narrateRules(bubbleCtx);
    expect(text).toContain("Bubble chart");
    expect(text).toContain("Untapped");
    expect(await explainChart(bubbleCtx, { backend: "rules" })).toBe(text);
  });

  it("narrates a sankey from its summary (insight coverage)", async () => {
    const sankeyCtx: SankeyChartContext = {
      chartType: "sankey-chart",
      renderer: "svg",
      nodes: [],
      links: [],
      stats: {
        nodeCount: 6,
        linkCount: 9,
        columnCount: 2,
        totalFlow: 229,
        largestLink: { source: "Germany", target: "EU", value: 55 },
        busiestNode: { id: "EU", value: 123 },
      },
      colorsMapping: {},
      summary:
        "Sankey diagram with 6 nodes in 2 columns and 9 links (total flow 229). Largest flow: Germany → EU (55).",
      a11yTable: { headers: ["Source", "Target", "Value"], rows: [] },
    };
    const text = narrateRules(sankeyCtx);
    expect(text).toContain("Sankey diagram");
    expect(text).toContain("Germany → EU");
    expect(await explainChart(sankeyCtx, { backend: "rules" })).toBe(text);
  });
});
