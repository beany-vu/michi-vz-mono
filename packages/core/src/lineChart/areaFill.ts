// LineChart `areaFill`: each series filled down to a baseline with a vertical
// fade (series colour at `topOpacity` at the top of the plot, `bottomOpacity`
// at the baseline). Pure geometry here; renderSvg/renderCanvas draw it.
import { area as d3area } from "d3-shape";
import { resolveCurveFactory } from "./curve";
import { projectX } from "./geometry";
import { cssColorToPremultiplied } from "../webgpu/color";
import type {
  CurveType,
  DataPoint,
  LineAreaFillConfig,
  LineChartProps,
  XaxisDataType,
} from "../types";
import type { LineXScale, LineYScale } from "./scales";

export type ResolvedLineAreaFill = Required<LineAreaFillConfig>;

export function resolveLineAreaFill(v: LineChartProps["areaFill"]): ResolvedLineAreaFill | null {
  if (!v) return null;
  const cfg = v === true ? {} : v;
  return {
    topOpacity: cfg.topOpacity ?? 0.5,
    bottomOpacity: cfg.bottomOpacity ?? 0,
    baseline: cfg.baseline ?? 0,
  };
}

// Pixel y of the baseline value, clamped into the plot so a baseline outside
// the y-domain (e.g. 0 under a log axis or a domain starting above 0) fills to
// the nearest plot edge instead of past the axes.
export function areaBaselineY(yScale: LineYScale, baseline: number): number {
  const [a, b] = yScale.range();
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const y = yScale(baseline);
  if (!Number.isFinite(y)) return hi; // log scale: 0 has no position -> bottom
  return Math.min(hi, Math.max(lo, y));
}

// The whole series as ONE closed area (gaps included): the fill reads as the
// shape under the line, while the line itself still dashes its uncertain runs.
export function buildAreaPath(
  series: DataPoint[],
  xScale: LineXScale,
  yScale: LineYScale,
  xAxisDataType: XaxisDataType,
  curve: CurveType | undefined,
  baselineY: number,
): string {
  if (series.length < 2) return "";
  const d = d3area<DataPoint>()
    .x((p) => projectX(p, xScale, xAxisDataType))
    .y0(baselineY)
    .y1((p) => yScale(p.value))
    .curve(resolveCurveFactory(curve))(series);
  return d ?? "";
}

// A CSS colour at a given alpha, as an rgba() string for canvas gradient stops
// (the colour may already be the rgb()/hex/named form the probe returned).
export function withAlpha(css: string, alpha: number): string {
  const [r, g, b, a] = cssColorToPremultiplied(css);
  if (a <= 0) return "rgba(0,0,0,0)";
  const ch = (v: number) => Math.round((v / a) * 255);
  return `rgba(${ch(r)},${ch(g)},${ch(b)},${+(a * alpha).toFixed(4)})`;
}
