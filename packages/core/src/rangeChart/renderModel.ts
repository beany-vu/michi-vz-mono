// Renderer-agnostic RangeChart model: one band area path (+ median line) per series.
import { sanitizeForClassName } from "../math/sanitize";
import { makeRangeAreaGenerator, makeRangeMedianGenerator } from "./geometry";
import type { CurveType, RangeDataItem, XaxisDataType } from "../types";
import type { LineScales } from "../lineChart/scales";
import type { RangeColorResolver } from "./colors";

export interface RangeSeriesModel {
  label: string;
  safe: string;
  color: string;
  areaPath: string;
  medianPath: string;
  dimmed: boolean;
}

export interface RangeRenderModel {
  series: RangeSeriesModel[];
}

export interface BuildRangeModelOptions {
  xAxisDataType: XaxisDataType;
  curve?: CurveType;
  highlightItems: string[];
}

export function buildRangeRenderModel(
  items: RangeDataItem[],
  scales: LineScales,
  colors: RangeColorResolver,
  o: BuildRangeModelOptions
): RangeRenderModel {
  const area = makeRangeAreaGenerator(scales.xScale, scales.yScale, o.xAxisDataType, o.curve);
  const median = makeRangeMedianGenerator(scales.xScale, scales.yScale, o.xAxisDataType, o.curve);
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;

  const series: RangeSeriesModel[] = items.map((it) => ({
    label: it.label,
    safe: sanitizeForClassName(it.label),
    color: colors.getColor(it.label),
    areaPath: area(it.series) ?? "",
    medianPath: median(it.series) ?? "",
    dimmed: anyHighlight && !highlightSet.has(it.label),
  }));

  return { series };
}
