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
  /** Fill for the value-based sub-bar (colorsBasedMapping, else the row colour). */
  basedColor: string;
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
  /** Floor a sub-bar's pixel width so near-zero values stay visible (default 5). */
  minBarWidth?: number;
  /** Per-label colour override for the value-based sub-bar (legacy colorsBasedMapping). */
  colorsBasedMapping?: Record<string, string>;
}

// Legacy z-order: the LONGER sub-bar is drawn first and the shorter one last (on
// top), so both stay visible when one contains the other. Ties keep the historical
// based-then-compared order.
export function comparableDrawOrder(bar: ComparableBarModel): ["based" | "compared", "based" | "compared"] {
  return bar.based.width < bar.compared.width ? ["compared", "based"] : ["based", "compared"];
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
  const minW = o.minBarWidth ?? 5;

  const seg = (v: number): { x: number; width: number } => {
    const px = scales.xScale(v);
    const width = Math.abs(px - zero);
    // Floor non-zero widths so a near-zero value isn't a sub-pixel invisible bar;
    // a literal zero stays zero (no phantom bar at the origin).
    return { x: Math.min(zero, px), width: width === 0 ? 0 : Math.max(width, minW) };
  };

  const bars: ComparableBarModel[] = points.map((d) => ({
    raw: d,
    label: d.label,
    safe: sanitizeForClassName(d.label),
    color: colors.getColor(d.label),
    basedColor: o.colorsBasedMapping?.[d.label] ?? colors.getColor(d.label),
    y: scales.yScale(d.label) ?? 0,
    height: bandHeight,
    based: seg(d.valueBased),
    compared: seg(d.valueCompared),
    dimmed: anyHighlight && !highlightSet.has(d.label),
  }));

  return { bars };
}
