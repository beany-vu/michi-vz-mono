// Renderer-agnostic ComparableHorizontalBar model: per label, two horizontal
// sub-bars (based behind, compared in front), diverging from x=0.
import { sanitizeForClassName } from "../math/sanitize";
import type { ComparableBarDataPoint } from "../types";
import type { ComparableScales } from "./scales";
import type { ComparableColorResolver } from "./colors";

export interface ComparableBarModel {
  raw: ComparableBarDataPoint;
  label: string;
  safe: string;
  color: string;
  y: number;
  height: number;
  based: { x: number; width: number };
  compared: { x: number; width: number };
  dimmed: boolean;
}

export interface ComparableRenderModel {
  bars: ComparableBarModel[];
}

export interface BuildComparableModelOptions {
  highlightItems: string[];
}

export function buildComparableRenderModel(
  points: ComparableBarDataPoint[],
  scales: ComparableScales,
  colors: ComparableColorResolver,
  o: BuildComparableModelOptions
): ComparableRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;
  const zero = scales.xScale(0);
  const bandHeight = scales.yScale.bandwidth();

  const seg = (v: number): { x: number; width: number } => {
    const px = scales.xScale(v);
    return { x: Math.min(zero, px), width: Math.abs(px - zero) };
  };

  const bars: ComparableBarModel[] = points.map((d) => ({
    raw: d,
    label: d.label,
    safe: sanitizeForClassName(d.label),
    color: colors.getColor(d.label),
    y: scales.yScale(d.label) ?? 0,
    height: bandHeight,
    based: seg(d.valueBased),
    compared: seg(d.valueCompared),
    dimmed: anyHighlight && !highlightSet.has(d.label),
  }));

  return { bars };
}
