// Renderer-agnostic semantic context for ComparableVerticalBar. Unlike
// ComparableHorizontalBarChart (whose DeltaIndicatorConfig JSDoc explicitly
// defers this), THIS chart's context DOES reflect the delta indicator when
// active: each series row is annotated with its resolved direction/colour/label
// (see comparableVerticalBar/delta.ts's resolveDeltaDirectionColor, the single
// decision table shared with the SVG glyph geometry).
import { buildLegendData } from "./legend";
import { resolveDeltaDirectionColor, DELTA_GOOD_COLOR } from "../comparableVerticalBar/delta";
import type { ComparableDeltaGeometryOptions } from "../comparableBar/delta";
import type {
  ComparableVerticalBarChartContext,
  ComparableBarDataPoint,
  ComparableVerticalBarSeriesContext,
} from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildComparableVerticalContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  yAxisDomain: [number, number];
  points: ComparableBarDataPoint[];
  colorsMapping: Record<string, string>;
  disabledItems?: string[];
  /** When set, the delta indicator is active for this render (undefined = prop
   * omitted / `show: false`, a provable no-op: no per-series delta fields, no
   * extra a11y column, no extra summary sentence). */
  deltaIndicator?: ComparableDeltaGeometryOptions;
}

export function buildComparableVerticalBarContext(
  input: BuildComparableVerticalContextInput
): ComparableVerticalBarChartContext {
  let improved = 0;
  let worsened = 0;
  const series: ComparableVerticalBarSeriesContext[] = input.points.map((d) => {
    const difference = round(d.valueCompared - d.valueBased);
    const row: ComparableVerticalBarSeriesContext = {
      label: d.label,
      color: input.colorsMapping[d.label] ?? d.color ?? "",
      valueBased: d.valueBased,
      valueCompared: d.valueCompared,
      difference,
    };
    if (input.deltaIndicator) {
      const { direction, color } = resolveDeltaDirectionColor(d.valueCompared - d.valueBased, input.deltaIndicator);
      row.deltaDirection = direction;
      row.deltaColor = color;
      row.deltaLabel = input.deltaIndicator.formatter(d.valueCompared - d.valueBased, d);
      if (direction !== "flat") {
        if (color === DELTA_GOOD_COLOR) improved++;
        else worsened++;
      }
    }
    return row;
  });

  const totalBased = round(series.reduce((a, s) => a + s.valueBased, 0));
  const totalCompared = round(series.reduce((a, s) => a + s.valueCompared, 0));
  let largestMover: { label: string; difference: number } | null = null;
  let grew = 0;
  let shrank = 0;
  let unchanged = 0;
  for (const s of series) {
    if (s.difference > 0) grew++;
    else if (s.difference < 0) shrank++;
    else unchanged++;
    if (!largestMover || Math.abs(s.difference) > Math.abs(largestMover.difference)) {
      largestMover = { label: s.label, difference: s.difference };
    }
  }

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Comparable vertical bar chart ${titlePart}compares based vs compared across ${series.length} item${
    series.length === 1 ? "" : "s"
  }.`;
  if (largestMover && largestMover.difference !== 0) {
    const dir = largestMover.difference > 0 ? "gained" : "dropped";
    summary += ` ${largestMover.label} ${dir} the most (${largestMover.difference}).`;
  }
  if (input.deltaIndicator) {
    summary += ` ${improved} improved, ${worsened} worsened.`;
  }

  // The flat colour-contract payload the consumer colour authority reads via
  // onChartDataProcessed(ctx).legendData. Without it, thd's setMetadata
  // early-returns and colorsMapping stays {} -> every bar resolves transparent.
  const legendData = buildLegendData({
    labels: input.points.map((p) => p.label),
    colorsMapping: input.colorsMapping,
    disabledItems: input.disabledItems,
  });

  const headers = input.deltaIndicator
    ? ["Label", "Based", "Compared", "Difference", "Change"]
    : ["Label", "Based", "Compared", "Difference"];
  const rows = series.map((s) =>
    input.deltaIndicator
      ? [s.label, s.valueBased, s.valueCompared, s.difference, s.deltaLabel ?? ""]
      : [s.label, s.valueBased, s.valueCompared, s.difference]
  );

  return {
    chartType: "comparable-vertical-bar-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { labels: series.map((s) => s.label) },
    yAxis: { domain: input.yAxisDomain },
    series,
    stats: { count: series.length, totalBased, totalCompared, largestMover, grew, shrank, unchanged, improved, worsened },
    colorsMapping: input.colorsMapping,
    legendData,
    summary,
    a11yTable: { headers, rows },
  };
}
