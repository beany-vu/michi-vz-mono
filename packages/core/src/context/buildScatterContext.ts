// Renderer-agnostic semantic context for ScatterPlot. x/y means + Pearson
// correlation + a chart-agnostic a11yTable (one row per point) + NL summary.
import type { Renderer, ScatterChartContext, ScatterDataPoint, XaxisDataType } from "../types";
import { buildLegendData } from "./legend";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildScatterContextInput {
  title?: string;
  renderer: Renderer;
  xAxisDataType: XaxisDataType;
  xAxisDomain: [number, number] | string[];
  yAxisDomain: [number, number];
  points: ScatterDataPoint[];
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
    : `x ranges ${round((input.xAxisDomain as [number, number])[0])}–${round(
        (input.xAxisDomain as [number, number])[1]
      )}`;
  summary += ` ${xPart}, y ${round(input.yAxisDomain[0])}–${round(input.yAxisDomain[1])}.`;
  if (correlation !== null) {
    const strength =
      Math.abs(correlation) > 0.7 ? "strong" : Math.abs(correlation) > 0.4 ? "moderate" : "weak";
    const dir = correlation > 0 ? "positive" : "negative";
    summary += ` ${strength} ${dir} correlation (r=${correlation}).`;
  }

  // Flat colour-contract payload the consumer colour authority reads via
  // onChartDataProcessed(ctx).legendData. Without it thd's setMetadata
  // early-returns → colorsMapping stays {} → points resolve transparent.
  const legendData = buildLegendData({
    labels: input.points.map((p) => p.label),
    colorsMapping: input.colorsMapping,
    disabledItems: input.disabledItems,
  });

  return {
    chartType: "scatter-plot-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { type: input.xAxisDataType, domain: input.xAxisDomain },
    yAxis: { domain: input.yAxisDomain },
    pointCount: n,
    stats: { xMean, yMean, correlation },
    colorsMapping: input.colorsMapping,
    legendData,
    summary,
    a11yTable: {
      headers: ["Label", "X", "Y", "Size"],
      rows: pts.map((p) => [p.label, p.x, p.y, p.d ?? "—"]),
    },
  };
}
