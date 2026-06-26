// Renderer-agnostic semantic context for LineChart. Derived from the processed
// data model (NOT the DOM), so it is identical in SVG and canvas mode. Produces
// per-series stats, a chart-agnostic a11yTable, and a deterministic NL summary.
import type {
  LineChartContext,
  LineDataItem,
  LineSeriesContext,
  XaxisDataType,
} from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildLineContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  xAxisDataType: XaxisDataType;
  xAxisDomain: [number, number];
  yAxisDomain: [number, number];
  processedDataSet: LineDataItem[];
  colorsMapping: Record<string, string>;
}

function seriesContext(item: LineDataItem): LineSeriesContext {
  const pts = item.series;
  const values = pts.map((d) => d.value).filter((v) => Number.isFinite(v));
  const first = pts.length ? { x: pts[0].date, y: pts[0].value } : null;
  const last = pts.length ? { x: pts[pts.length - 1].date, y: pts[pts.length - 1].value } : null;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const mean = values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const change = first && last ? round(last.y - first.y) : 0;
  const changePct =
    first && last && first.y !== 0 ? round(((last.y - first.y) / Math.abs(first.y)) * 100) : null;
  const trend = change > 0 ? "up" : change < 0 ? "down" : "flat";
  // Uncertain segments (gaps / dashed) — first point has no incoming segment.
  const gaps = pts.reduce((n, d, i) => (i > 0 && d.certainty === false ? n + 1 : n), 0);

  return {
    label: item.label,
    code: pts.find((d) => d.code)?.code,
    color: item.color ?? "",
    pointCount: pts.length,
    first,
    last,
    min: round(min),
    max: round(max),
    mean,
    change,
    changePct,
    trend,
    gaps,
  };
}

export function buildLineContext(input: BuildLineContextInput): LineChartContext {
  const series = input.processedDataSet.map(seriesContext);
  const pointCount = series.reduce((n, s) => n + s.pointCount, 0);

  let largestMover: { label: string; change: number } | null = null;
  for (const s of series) {
    if (!largestMover || Math.abs(s.change) > Math.abs(largestMover.change)) {
      largestMover = { label: s.label, change: s.change };
    }
  }

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Line chart ${titlePart}with ${series.length} series over ${pointCount} point${
    pointCount === 1 ? "" : "s"
  }.`;
  if (largestMover && largestMover.change !== 0) {
    const dir = largestMover.change > 0 ? "rose" : "fell";
    summary += ` ${largestMover.label} ${dir} the most (${largestMover.change}).`;
  }
  summary += ` Value range ${round(input.yAxisDomain[0])}–${round(input.yAxisDomain[1])}.`;

  return {
    chartType: "line-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { type: input.xAxisDataType, domain: input.xAxisDomain },
    yAxis: { domain: input.yAxisDomain },
    series,
    stats: {
      seriesCount: series.length,
      pointCount,
      largestMover,
      valueRange: [round(input.yAxisDomain[0]), round(input.yAxisDomain[1])],
    },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Series", "Points", "First", "Last", "Change", "Trend"],
      rows: series.map((s) => [
        s.label,
        s.pointCount,
        s.first ? s.first.y : "—",
        s.last ? s.last.y : "—",
        s.change,
        s.trend,
      ]),
    },
  };
}
