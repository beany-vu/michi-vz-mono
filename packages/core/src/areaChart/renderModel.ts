// Renderer-agnostic AreaChart model: one structure for the SVG + canvas renderers
// and the context builder. One entry per active key: bottom-to-top when stacked,
// DRAW order (largest first) when overlapping (stacked:false).
import { sanitizeForClassName } from "../math/sanitize";
import { makeAreaGenerator, makeAreaTopLineGenerator } from "./geometry";
import type { AreaDatum, AreaStackedPoint } from "./data";
import type { AreaColorResolver } from "./colors";
import type { AreaScales } from "./scales";
import type { CurveType, XaxisDataType } from "../types";

/** Overlapping mode: fill opacity of each area, so the shapes behind stay visible. */
export const AREA_OVERLAP_FILL_OPACITY = 0.2;
/** Overlapping mode: width (px) of the line drawn along each area's top edge. */
export const AREA_OVERLAP_LINE_WIDTH = 1.5;
/** Opacity multiplier for a series dimmed by highlightItems (both modes). */
export const AREA_DIMMED_OPACITY = 0.05;

export interface AreaSeriesModel {
  key: string;
  safe: string;
  fill: string;
  path: string;
  /** Top-edge line (x, y1) path. Built in overlapping mode only; "" when stacked. */
  linePath: string;
  values: AreaStackedPoint[];
  dimmed: boolean;
}

export interface AreaRenderModel {
  /** "stacked" (default) or "overlap" (stacked:false); the renderers branch on it. */
  mode: "stacked" | "overlap";
  series: AreaSeriesModel[];
}

export interface BuildAreaModelOptions {
  xAxisDataType: XaxisDataType;
  curve?: CurveType;
  highlightItems: string[];
  /** false = overlapping areas (adds each series' top-edge line). Default true. */
  stacked?: boolean;
}

export function buildAreaRenderModel(
  stacked: AreaDatum[],
  scales: AreaScales,
  colors: AreaColorResolver,
  o: BuildAreaModelOptions,
): AreaRenderModel {
  const gen = makeAreaGenerator(scales.xScale, scales.yScale, o.xAxisDataType, o.curve);
  const overlap = o.stacked === false;
  const topLine = overlap
    ? makeAreaTopLineGenerator(scales.xScale, scales.yScale, o.xAxisDataType, o.curve)
    : null;
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;

  const series: AreaSeriesModel[] = stacked.map((layer) => ({
    key: layer.key,
    safe: sanitizeForClassName(layer.key),
    fill: colors.getColor(layer.key),
    path: gen(layer.values) ?? "",
    linePath: topLine ? (topLine(layer.values) ?? "") : "",
    values: layer.values,
    dimmed: anyHighlight && !highlightSet.has(layer.key),
  }));

  return { mode: overlap ? "overlap" : "stacked", series };
}
