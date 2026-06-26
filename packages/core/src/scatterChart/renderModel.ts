// Renderer-agnostic ScatterPlot model. Points are projected to pixel cx/cy/r and
// sorted largest-first so smaller bubbles draw on top (matching the legacy).
import { sanitizeForClassName } from "../math/sanitize";
import { parseXValue } from "../lineChart/lineUtils";
import type { ScatterScales } from "./scales";
import type { ScatterColorResolver } from "./colors";
import type { ScatterDataPoint, Shape, XaxisDataType } from "../types";

export interface ScatterPointModel {
  raw: ScatterDataPoint;
  label: string;
  safe: string;
  cx: number;
  cy: number;
  r: number;
  shape: Shape;
  color: string;
  dimmed: boolean;
}

export interface ScatterRenderModel {
  points: ScatterPointModel[];
}

export interface BuildScatterModelOptions {
  xAxisDataType: XaxisDataType;
  highlightItems: string[];
  /** fixed radius for points without a `d` size value. */
  defaultRadius: number;
}

export function buildScatterRenderModel(
  points: ScatterDataPoint[],
  scales: ScatterScales,
  colors: ScatterColorResolver,
  o: BuildScatterModelOptions
): ScatterRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;

  const models: ScatterPointModel[] = points.map((p) => {
    const xv = parseXValue(p.x, o.xAxisDataType);
    const cx = (scales.xScale as (x: number | Date) => number)(xv);
    const cy = scales.yScale(p.y);
    const r = p.d === undefined ? o.defaultRadius : scales.sizeScale(p.d);
    return {
      raw: p,
      label: p.label,
      safe: sanitizeForClassName(p.label),
      cx,
      cy,
      r,
      shape: p.shape ?? "circle",
      color: colors.getColor(p.label),
      dimmed: anyHighlight && !highlightSet.has(p.label),
    };
  });

  // Largest first so smaller points end up on top (z-order).
  models.sort((a, b) => b.r - a.r);
  return { points: models };
}
