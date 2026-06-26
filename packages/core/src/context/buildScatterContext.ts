// Renderer-agnostic semantic context for ScatterPlot. x/y means + Pearson
// correlation + a chart-agnostic a11yTable (one row per point) + NL summary.
import type { ScatterChartContext, ScatterDataPoint, XaxisDataType } from "../types";

const round = (n: number): number => Math.round(n * 100) / 100;

export interface BuildScatterContextInput {
  title?: string;
  renderer: "svg" | "canvas";
  xAxisDataType: XaxisDataType;
  xAxisDomain: [number, number];
  yAxisDomain: [number, number];
  points: ScatterDataPoint[];
  colorsMapping: Record<string, string>;
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
  const xMean = n ? round(pts.reduce((a, p) => a + p.x, 0) / n) : 0;
  const yMean = n ? round(pts.reduce((a, p) => a + p.y, 0) / n) : 0;
  const correlation = pearson(pts);

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Scatter plot ${titlePart}with ${n} point${n === 1 ? "" : "s"}.`;
  summary += ` x ranges ${round(input.xAxisDomain[0])}–${round(input.xAxisDomain[1])}, y ${round(
    input.yAxisDomain[0]
  )}–${round(input.yAxisDomain[1])}.`;
  if (correlation !== null) {
    const strength =
      Math.abs(correlation) > 0.7 ? "strong" : Math.abs(correlation) > 0.4 ? "moderate" : "weak";
    const dir = correlation > 0 ? "positive" : "negative";
    summary += ` ${strength} ${dir} correlation (r=${correlation}).`;
  }

  return {
    chartType: "scatter-plot-chart",
    title: input.title,
    renderer: input.renderer,
    xAxis: { type: input.xAxisDataType, domain: input.xAxisDomain },
    yAxis: { domain: input.yAxisDomain },
    pointCount: n,
    stats: { xMean, yMean, correlation },
    colorsMapping: input.colorsMapping,
    summary,
    a11yTable: {
      headers: ["Label", "X", "Y", "Size"],
      rows: pts.map((p) => [p.label, p.x, p.y, p.d ?? "—"]),
    },
  };
}
