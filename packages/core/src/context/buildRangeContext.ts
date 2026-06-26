// Renderer-agnostic semantic context for RangeChart.
import type { RangeChartContext, RangeDataItem, RangeSeriesContext, XaxisDataType } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildRangeContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  xAxisDataType: XaxisDataType;
  xAxisDomain: [number, number];
  yAxisDomain: [number, number];
  items: RangeDataItem[];
  colorsMapping: Record<string, string>;
}

function seriesContext(it: RangeDataItem, color: string): RangeSeriesContext {
  const mins = it.series.map((p) => p.valueMin).filter(Number.isFinite);
  const maxs = it.series.map((p) => p.valueMax).filter(Number.isFinite);
  const ranges = it.series.map((p) => p.valueMax - p.valueMin).filter(Number.isFinite);
  const meanRange = ranges.length ? ranges.reduce((a, b) => a + b, 0) / ranges.length : 0;
  return {
    label: it.label,
    color,
    pointCount: it.series.length,
    minValue: mins.length ? round(Math.min(...mins)) : 0,
    maxValue: maxs.length ? round(Math.max(...maxs)) : 0,
    meanRange: round(meanRange),
  };
}

export function buildRangeContext(input: BuildRangeContextInput): RangeChartContext {
  const series = input.items.map((it) => seriesContext(it, input.colorsMapping[it.label] ?? it.color ?? ""));
  const pointCount = series.reduce((n, s) => n + s.pointCount, 0);

  const titlePart = input.title ? `"${input.title}" ` : "";
  const summary =
    `Range chart ${titlePart}with ${series.length} band${series.length === 1 ? "" : "s"} over ${pointCount} point${
      pointCount === 1 ? "" : "s"
    }. Value range ${round(input.yAxisDomain[0])}–${round(input.yAxisDomain[1])}.`;

  return {
    chartType: "range-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { type: input.xAxisDataType, domain: input.xAxisDomain },
    yAxis: { domain: input.yAxisDomain },
    series,
    stats: {
      seriesCount: series.length,
      pointCount,
      valueRange: [round(input.yAxisDomain[0]), round(input.yAxisDomain[1])],
    },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Band", "Points", "Min", "Max", "Mean range"],
      rows: series.map((s) => [s.label, s.pointCount, s.minValue, s.maxValue, s.meanRange]),
    },
  };
}
