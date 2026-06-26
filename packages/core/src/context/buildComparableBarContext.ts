// Renderer-agnostic semantic context for ComparableHorizontalBar.
import type {
  ComparableBarChartContext,
  ComparableBarDataPoint,
  ComparableBarSeriesContext,
} from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildComparableContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  xAxisDomain: [number, number];
  points: ComparableBarDataPoint[];
  colorsMapping: Record<string, string>;
}

export function buildComparableBarContext(
  input: BuildComparableContextInput
): ComparableBarChartContext {
  const series: ComparableBarSeriesContext[] = input.points.map((d) => ({
    label: d.label,
    color: input.colorsMapping[d.label] ?? d.color ?? "",
    valueBased: d.valueBased,
    valueCompared: d.valueCompared,
    difference: round(d.valueCompared - d.valueBased),
  }));

  const totalBased = round(series.reduce((a, s) => a + s.valueBased, 0));
  const totalCompared = round(series.reduce((a, s) => a + s.valueCompared, 0));
  let largestMover: { label: string; difference: number } | null = null;
  for (const s of series) {
    if (!largestMover || Math.abs(s.difference) > Math.abs(largestMover.difference)) {
      largestMover = { label: s.label, difference: s.difference };
    }
  }

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Comparable horizontal bar chart ${titlePart}compares based vs compared across ${series.length} item${
    series.length === 1 ? "" : "s"
  }.`;
  if (largestMover && largestMover.difference !== 0) {
    const dir = largestMover.difference > 0 ? "gained" : "dropped";
    summary += ` ${largestMover.label} ${dir} the most (${largestMover.difference}).`;
  }

  return {
    chartType: "comparable-horizontal-bar-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { domain: input.xAxisDomain },
    yAxis: { labels: series.map((s) => s.label) },
    series,
    stats: { count: series.length, totalBased, totalCompared, largestMover },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Label", "Based", "Compared", "Difference"],
      rows: series.map((s) => [s.label, s.valueBased, s.valueCompared, s.difference]),
    },
  };
}
