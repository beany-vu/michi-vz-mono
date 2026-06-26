// Renderer-agnostic AreaChart model: one structure for the SVG + canvas renderers
// and the context builder. One entry per stacked key (bottom-to-top).
import { sanitizeForClassName } from "../math/sanitize";
import { makeAreaGenerator } from "./geometry";
import type { AreaDatum, AreaStackedPoint } from "./data";
import type { AreaColorResolver } from "./colors";
import type { AreaScales } from "./scales";
import type { CurveType, XaxisDataType } from "../types";

export interface AreaSeriesModel {
  key: string;
  safe: string;
  fill: string;
  path: string;
  values: AreaStackedPoint[];
  dimmed: boolean;
}

export interface AreaRenderModel {
  series: AreaSeriesModel[];
}

export interface BuildAreaModelOptions {
  xAxisDataType: XaxisDataType;
  curve?: CurveType;
  highlightItems: string[];
}

export function buildAreaRenderModel(
  stacked: AreaDatum[],
  scales: AreaScales,
  colors: AreaColorResolver,
  o: BuildAreaModelOptions
): AreaRenderModel {
  const gen = makeAreaGenerator(scales.xScale, scales.yScale, o.xAxisDataType, o.curve);
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;

  const series: AreaSeriesModel[] = stacked.map((layer) => ({
    key: layer.key,
    safe: sanitizeForClassName(layer.key),
    fill: colors.getColor(layer.key),
    path: gen(layer.values) ?? "",
    values: layer.values,
    dimmed: anyHighlight && !highlightSet.has(layer.key),
  }));

  return { series };
}
