// Renderer-agnostic DualHorizontalBar model: per label, a right bar (value1) and a
// left bar (value2) diverging from the centre.
import { sanitizeForClassName } from "../math/sanitize";
import type { DualBarDataPoint } from "../types";
import type { DualScales } from "./scales";
import type { DualColorResolver } from "./colors";

export interface DualBarModel {
  raw: DualBarDataPoint;
  label: string;
  safe: string;
  color: string;
  y: number;
  height: number;
  bar1: { x: number; width: number }; // value1, right of centre
  bar2: { x: number; width: number }; // value2, left of centre
  dimmed: boolean;
}

export interface DualRenderModel {
  bars: DualBarModel[];
  center: number;
}

export function buildDualRenderModel(
  points: DualBarDataPoint[],
  scales: DualScales,
  colors: DualColorResolver,
  highlightItems: string[]
): DualRenderModel {
  const highlightSet = new Set(highlightItems);
  const anyHighlight = highlightSet.size > 0;
  const bandHeight = scales.yScale.bandwidth();
  const { center } = scales;

  const bars: DualBarModel[] = points.map((d) => {
    const right = scales.xScale1(d.value1);
    const left = scales.xScale2(d.value2);
    return {
      raw: d,
      label: d.label,
      safe: sanitizeForClassName(d.label),
      color: colors.getColor(d.label),
      y: scales.yScale(d.label) ?? 0,
      height: bandHeight,
      bar1: { x: center, width: Math.max(0, right - center) },
      bar2: { x: left, width: Math.max(0, center - left) },
      dimmed: anyHighlight && !highlightSet.has(d.label),
    };
  });

  return { bars, center };
}
