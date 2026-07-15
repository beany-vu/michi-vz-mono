// Renderer-agnostic ScatterPlot model. Points are projected to pixel cx/cy/r and
// sorted largest-first so smaller bubbles draw on top (matching the legacy).
import { sanitizeForClassName } from "../math/sanitize";
import { parseXValue } from "../lineChart/lineUtils";
import type { ScaleBand } from "d3-scale";
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
  /**
   * @see ScatterChartProps["drawOrder"]. Default/omitted resolves to
   * `"sizeDescending"` (this function's pre-existing, zero-diff behaviour:
   * points sorted largest-first so smaller marks draw last / on top).
   * `"sizeAscending"` is a genuine opt-in that flips the comparator so the
   * LARGEST bubble draws LAST / on top instead, reproducing the actual
   * legacy sdg-trade z-order (see ScatterChartProps["drawOrder"] JSDoc).
   */
  drawOrder?: "sizeDescending" | "sizeAscending";
}

export function buildScatterRenderModel(
  points: ScatterDataPoint[],
  scales: ScatterScales,
  colors: ScatterColorResolver,
  o: BuildScatterModelOptions,
): ScatterRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;

  let firstR: number | null = null;
  let uniformR = true;
  const models: ScatterPointModel[] = points.map((p) => {
    let cx: number;
    if (o.xAxisDataType === "band" && "bandwidth" in scales.xScale) {
      // Band: position by `label` (not the numeric `x`), centred in the band slot.
      const bandScale = scales.xScale as ScaleBand<string>;
      cx = (bandScale(p.label) ?? 0) + bandScale.bandwidth() / 2;
    } else {
      const xv = parseXValue(p.x, o.xAxisDataType);
      cx = (scales.xScale as (x: number | Date) => number)(xv);
    }
    const cy = scales.yScale(p.y);
    const r = p.d === undefined ? o.defaultRadius : scales.sizeScale(p.d);
    if (firstR === null) firstR = r;
    else if (r !== firstR) uniformR = false;
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

  // Default (`"sizeDescending"`, or omitted): largest first so smaller points
  // end up on top (z-order) - this library's pre-existing, zero-diff sort.
  // `"sizeAscending"` flips it (smallest first / largest last) to reproduce
  // the actual legacy sdg-trade z-order (see ScatterChartProps["drawOrder"]
  // JSDoc). Skipped entirely when every radius is identical (sizeRange
  // pinned or no `d` values): sort is stable, so the order would be
  // unchanged either way, and at 50k points it is pure O(n log n) cost.
  if (!uniformR) {
    if (o.drawOrder === "sizeAscending") models.sort((a, b) => a.r - b.r);
    else models.sort((a, b) => b.r - a.r);
  }
  return { points: models };
}
