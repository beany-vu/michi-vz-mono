// Renderer-agnostic semantic context for ScatterPlot. x/y means + Pearson
// correlation + a chart-agnostic a11yTable (one row per point) + NL summary.
import type {
  Renderer,
  ScatterChartContext,
  ScatterDataPoint,
  ScatterSeriesContext,
  XaxisDataType,
} from "../types";
import { buildLegendData } from "./legend";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildScatterContextInput {
  title?: string;
  renderer: Renderer;
  xAxisDataType: XaxisDataType;
  xAxisDomain: [number, number] | string[];
  yAxisDomain: [number, number];
  points: ScatterDataPoint[];
  /** The PRE-disable rows (the engine's full dataSet for the active period). Feeds the
   * legend (a disabled label keeps its greyed pill in its original slot — the VSB 1.5.6 /
   * ComparableBar 1.12.2 contract) and the per-label `series` summary. Optional so
   * standalone callers keep the points-only behavior. */
  fullDataSet?: ScatterDataPoint[];
  colorsMapping: Record<string, string>;
  disabledItems?: string[];
}

function pearson(points: ScatterDataPoint[]): number | null {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
    sxy += p.x * p.y;
    sxx += p.x * p.x;
    syy += p.y * p.y;
  }
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  if (den === 0) return null;
  return round(num / den);
}

export function buildScatterContext(input: BuildScatterContextInput): ScatterChartContext {
  const pts = input.points;
  const n = pts.length;
  // Band x is categorical: the numeric mean / Pearson over `x` (a band index) are
  // meaningless, so suppress them and describe the category list in the summary.
  const isBand = input.xAxisDataType === "band";
  const xMean = !isBand && n ? round(pts.reduce((a, p) => a + p.x, 0) / n) : 0;
  const yMean = n ? round(pts.reduce((a, p) => a + p.y, 0) / n) : 0;
  const correlation = isBand ? null : pearson(pts);

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Scatter plot ${titlePart}with ${n} point${n === 1 ? "" : "s"}.`;
  const xPart = isBand
    ? `x categories ${(input.xAxisDomain as string[]).join(", ")}`
    : `x ranges ${round((input.xAxisDomain as [number, number])[0])}-${round(
        (input.xAxisDomain as [number, number])[1],
      )}`;
  summary += ` ${xPart}, y ${round(input.yAxisDomain[0])}-${round(input.yAxisDomain[1])}.`;
  if (correlation !== null) {
    const strength =
      Math.abs(correlation) > 0.7 ? "strong" : Math.abs(correlation) > 0.4 ? "moderate" : "weak";
    const dir = correlation > 0 ? "positive" : "negative";
    summary += ` ${strength} ${dir} correlation (r=${correlation}).`;
  }

  // Flat colour-contract payload the consumer colour authority reads via
  // onChartDataProcessed(ctx).legendData. Without it thd's setMetadata
  // early-returns → colorsMapping stays {} → points resolve transparent.
  // Labels come from the PRE-disable rows when the engine provides them: `points`
  // are disabled-filtered, and deriving the legend from them dropped a clicked
  // label entirely (consumer fallbacks then re-appended it at the END — the thd
  // "disabled pill jumps to the last slot" bug). Same contract as VSB 1.5.6 /
  // ComparableBar 1.12.2: walk the pre-disable rows so a disabled label keeps its
  // flagged pill in its original slot, but keep only visible-or-disabled labels so
  // a rank/date-filtered-out label is not resurrected.
  const legendRows = input.fullDataSet ?? input.points;
  const visibleLabels = new Set(input.points.map((p) => p.label));
  const disabledSet = new Set(input.disabledItems ?? []);
  const seenLegendLabels = new Set<string>();
  const legendLabels: string[] = [];
  for (const p of legendRows) {
    if (seenLegendLabels.has(p.label)) continue;
    if (!visibleLabels.has(p.label) && !disabledSet.has(p.label)) continue;
    seenLegendLabels.add(p.label);
    legendLabels.push(p.label);
  }
  const legendData = buildLegendData({
    labels: legendLabels,
    colorsMapping: input.colorsMapping,
    disabledItems: input.disabledItems,
  });

  // Per-label newest-point summary (max x, last occurrence on ties), from the
  // pre-disable rows so disabled labels keep their value for consumer ranking.
  const latestByLabel = new Map<string, ScatterDataPoint>();
  for (const p of legendRows) {
    const prev = latestByLabel.get(p.label);
    if (!prev || p.x >= prev.x) latestByLabel.set(p.label, p);
  }
  const series: ScatterSeriesContext[] = legendLabels.map((label) => {
    const p = latestByLabel.get(label);
    return {
      label,
      ...(p?.code != null ? { code: p.code } : {}),
      last: p ? { x: p.x, y: p.y } : null,
    };
  });

  return {
    chartType: "scatter-plot-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { type: input.xAxisDataType, domain: input.xAxisDomain },
    yAxis: { domain: input.yAxisDomain },
    pointCount: n,
    series,
    stats: { xMean, yMean, correlation },
    colorsMapping: input.colorsMapping,
    legendData,
    summary,
    a11yTable: {
      headers: ["Label", "X", "Y", "Size"],
      rows: pts.map((p) => [p.label, p.x, p.y, p.d ?? "-"]),
    },
  };
}
