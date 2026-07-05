// Renderer-agnostic semantic context for DualHorizontalBar (tornado).
import type { DualBarChartContext, DualBarDataPoint, DualBarSeriesContext } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildDualContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  xAxisDomain: [number, number];
  points: DualBarDataPoint[];
  colorsMapping: Record<string, string>;
}

export function buildDualBarContext(input: BuildDualContextInput): DualBarChartContext {
  const series: DualBarSeriesContext[] = input.points.map((d) => ({
    label: d.label,
    color: input.colorsMapping[d.label] ?? d.color ?? "",
    value1: d.value1,
    value2: d.value2,
  }));
  const total1 = round(series.reduce((a, s) => a + s.value1, 0));
  const total2 = round(series.reduce((a, s) => a + s.value2, 0));

  // The headline finding of a tornado is which row leans hardest to one side.
  let largestImbalance: { label: string; value1: number; value2: number; difference: number } | null =
    null;
  for (const s of series) {
    const difference = round(s.value1 - s.value2);
    if (!largestImbalance || Math.abs(difference) > Math.abs(largestImbalance.difference)) {
      largestImbalance = { label: s.label, value1: s.value1, value2: s.value2, difference };
    }
  }

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary =
    `Dual (diverging) horizontal bar chart ${titlePart}compares value1 (right) vs value2 (left) ` +
    `across ${series.length} item${series.length === 1 ? "" : "s"}. Totals: ${total1} vs ${total2}.`;
  if (largestImbalance && series.length > 1) {
    summary += ` Largest imbalance: ${largestImbalance.label} (${largestImbalance.value1} vs ${largestImbalance.value2}).`;
  }

  return {
    chartType: "dual-horizontal-bar-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { domain: input.xAxisDomain },
    yAxis: { labels: series.map((s) => s.label) },
    series,
    stats: { count: series.length, total1, total2, largestImbalance },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Label", "Value 1", "Value 2"],
      rows: series.map((s) => [s.label, s.value1, s.value2]),
    },
  };
}
