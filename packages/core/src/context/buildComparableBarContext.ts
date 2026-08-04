// Renderer-agnostic semantic context for ComparableHorizontalBar.
import { buildLegendData } from "./legend";
import type {
  ComparableBarChartContext,
  ComparableBarDataPoint,
  ComparableBarSeriesContext,
} from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildComparableContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  xAxisDomain: [number, number];
  points: ComparableBarDataPoint[];
  /** The ranked top-N slice BEFORE disabledItems were removed (present only while
   *  a `filter` is active). Source for renderedRankedIds so hiding a ranked bar
   *  via the legend never changes the emitted ranked positions. */
  rankedPoints?: ComparableBarDataPoint[];
  colorsMapping: Record<string, string>;
  disabledItems?: string[];
  /**
   * Labels for the LEGEND, including disabled ones (flagged `disabled: true`),
   * so a clicked pill dims in place instead of dropping out of legendData and
   * being re-appended (re-sorted) by the consumer. Defaults to the visible
   * points' labels for callers that don't thread it.
   */
  legendLabels?: string[];
}

export function buildComparableBarContext(
  input: BuildComparableContextInput,
): ComparableBarChartContext {
  const series: ComparableBarSeriesContext[] = input.points.map((d) => ({
    label: d.label,
    color: input.colorsMapping[d.label] ?? d.color ?? "",
    code: d.code,
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

  // The flat colour-contract payload the consumer colour authority reads via
  // onChartDataProcessed(ctx).legendData. Without it, thd's setMetadata
  // early-returns and colorsMapping stays {} → every bar resolves transparent.
  const legendData = buildLegendData({
    labels: input.legendLabels ?? input.points.map((p) => p.label),
    colorsMapping: input.colorsMapping,
    disabledItems: input.disabledItems,
  });

  return {
    chartType: "comparable-horizontal-bar-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { domain: input.xAxisDomain },
    yAxis: { labels: series.map((s) => s.label) },
    series,
    stats: { count: series.length, totalBased, totalCompared, largestMover },
    colorsMapping: input.colorsMapping,
    legendData,
    // The ranked slice PRE-disabledItems while a filter is active (hiding a bar
    // via the legend is view-level and must not shift the ranked set a consumer
    // mirrors into its selection); the drawn points otherwise.
    // != null (not Boolean) so a legitimate numeric 0 code survives.
    renderedRankedIds: (input.rankedPoints ?? input.points)
      .map((p) => p.code)
      .filter((c) => c != null && c !== "")
      .map(String),
    summary,
    a11yTable: {
      headers: ["Label", "Based", "Compared", "Difference"],
      rows: series.map((s) => [s.label, s.valueBased, s.valueCompared, s.difference]),
    },
  };
}
