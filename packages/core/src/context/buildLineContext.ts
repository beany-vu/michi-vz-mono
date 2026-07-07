// Renderer-agnostic semantic context for LineChart. Derived from the processed
// data model (NOT the DOM), so it is identical in SVG and canvas mode. Produces
// per-series stats, a chart-agnostic a11yTable, and a deterministic NL summary.
import type {
  LegendItem,
  LineChartContext,
  LineDataItem,
  LineSeriesContext,
  XaxisDataType,
} from "../types";
import { provenanceCounts } from "../math/provenance";
import { parseXValue } from "../lineChart/lineUtils";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildLineContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  xAxisDataType: XaxisDataType;
  xAxisDomain: [number, number];
  yAxisDomain: [number, number];
  processedDataSet: LineDataItem[];
  colorsMapping: Record<string, string>;
  /** Flat legend rows (label/dataLabelSafe/color/disabled) for the colour contract. */
  legendData?: LegendItem[];
  /** Labels the consumer has hidden - excluded from visibleItems (legacy parity). */
  disabledItems?: string[];
  /** Formats an x value into the period label used for the a11yTable columns (should
   *  match the on-screen x-axis, e.g. a year). Falls back to String(). */
  xFormat?: (d: number | string) => string;
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
  // Uncertain segments (gaps / dashed) - first point has no incoming segment.
  const gaps = pts.reduce((n, d, i) => (i > 0 && d.certainty === false ? n + 1 : n), 0);
  // Provenance: actual vs predicted (explicit `predicted`, else derived from certainty).
  const { actualCount, predictedCount, forecastStart } = provenanceCounts(pts);

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
    actualCount,
    predictedCount,
    forecastStart,
  };
}

export function buildLineContext(input: BuildLineContextInput): LineChartContext {
  const series = input.processedDataSet.map(seriesContext);
  const pointCount = series.reduce((n, s) => n + s.pointCount, 0);

  // Legacy useLineChartMetadataExpose parity: labels that are NOT disabled AND carry
  // ≥1 point. thd's Market/ProductDiversification read this off onChartDataProcessed to
  // sync their master/slave colour set; absent → the slave chart never syncs.
  const disabled = new Set(input.disabledItems ?? []);
  const visibleItems = input.processedDataSet
    .filter((d) => !disabled.has(d.label) && d.series.length > 0)
    .map((d) => d.label);

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
  summary += ` Value range ${round(input.yAxisDomain[0])}-${round(input.yAxisDomain[1])}.`;

  // Wide per-period data table: one column per distinct x value (labelled like the
  // axis), one row per series carrying its value at each period ("-" when absent). This
  // makes getContext().a11yTable -> CSV export carry EVERY plotted point (e.g. one
  // column per year) instead of a per-series summary. The per-series stats stay on
  // `series`/`stats` and the narrative on `summary`, so nothing is lost.
  const fmt = input.xFormat ?? ((d) => String(d));
  // The period label must match the on-screen axis: the axis parses each raw x value
  // (e.g. a bare year 2005) into the scale's unit (a Date for date_annual) BEFORE
  // formatting. Formatting the raw 2005 directly with a date formatter would read it as
  // an epoch (-> 1970). So parse first, then format (epoch for dates, number as-is).
  const labelFor = (raw: number | string): string => {
    const parsed = parseXValue(raw, input.xAxisDataType);
    return fmt(parsed instanceof Date ? parsed.getTime() : parsed);
  };
  const periods = Array.from(
    new Set(input.processedDataSet.flatMap((d) => d.series.map((p) => p.date)))
  ).sort((a, b) => Number(a) - Number(b));
  const a11yHeaders = ["Series", ...periods.map(labelFor)];
  const a11yRows = input.processedDataSet.map((d) => {
    const byDate = new Map(d.series.map((p) => [p.date, p.value]));
    return [
      d.label,
      ...periods.map((p) => (byDate.has(p) && Number.isFinite(byDate.get(p)) ? round(byDate.get(p)!) : "-")),
    ];
  });

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
    legendData: input.legendData,
    visibleItems,
    summary,
    a11yTable: {
      headers: a11yHeaders,
      rows: a11yRows,
    },
  };
}
