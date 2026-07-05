// Renderer-agnostic ComparableHorizontalBar model: per label, two horizontal
// sub-bars (based behind, compared in front), diverging from x=0.
import { sanitizeForClassName } from "../math/sanitize";
import type { ComparableBarDataPoint } from "../types";
import type { ComparableScales } from "./scales";
import type { ComparableColorResolver } from "./colors";
import { computeComparableDelta } from "./delta";
import type { ComparableDeltaGeometryOptions, ComparableDeltaModel } from "./delta";

export interface ComparableBarSegment {
  x: number;
  width: number;
  /** Sub-bar's own y/height: equal to the row's (y, height) in "overlay" layout; the
   * top or bottom half of it in "grouped" layout. */
  y: number;
  height: number;
}

export interface ComparableBarModel {
  raw: ComparableBarDataPoint;
  label: string;
  safe: string;
  color: string;
  /** Fill for the value-based sub-bar (colorsBasedMapping, else the row colour). */
  basedColor: string;
  /** Full row band - unaffected by `layout` (used for row-level hit-testing / leader lines). */
  y: number;
  height: number;
  based: ComparableBarSegment;
  compared: ComparableBarSegment;
  dimmed: boolean;
  /** Set only when DeltaIndicatorConfig.show is true; undefined is a provable no-op. */
  delta?: ComparableDeltaModel;
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
  /** "overlay" (default): both sub-bars span the full band, one drawn in front of the
   * other. "grouped": valueBased occupies the top half of the band, valueCompared the
   * bottom half - no overlap. Omitted/"overlay" is byte-identical to pre-layout output. */
  layout?: "overlay" | "grouped";
  /** Resolved row-level delta indicator geometry options; undefined (the default -
   * prop omitted or `show: false`) computes zero delta geometry (provable no-op). */
  deltaIndicator?: ComparableDeltaGeometryOptions;
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
  const grouped = o.layout === "grouped";
  const halfHeight = bandHeight / 2;

  const seg = (v: number, y: number, height: number): ComparableBarSegment => {
    const px = scales.xScale(v);
    const width = Math.abs(px - zero);
    // Floor non-zero widths so a near-zero value isn't a sub-pixel invisible bar;
    // a literal zero stays zero (no phantom bar at the origin).
    return { x: Math.min(zero, px), width: width === 0 ? 0 : Math.max(width, minW), y, height };
  };

  const bars: ComparableBarModel[] = points.map((d) => {
    const y = scales.yScale(d.label) ?? 0;
    // grouped: valueBased = top half, valueCompared = bottom half, no overlap.
    // overlay (default): both spans equal the full row band - identical to pre-layout output.
    const based = grouped ? seg(d.valueBased, y, halfHeight) : seg(d.valueBased, y, bandHeight);
    const compared = grouped
      ? seg(d.valueCompared, y + halfHeight, halfHeight)
      : seg(d.valueCompared, y, bandHeight);
    return {
      raw: d,
      label: d.label,
      safe: sanitizeForClassName(d.label),
      color: colors.getColor(d.label),
      basedColor: o.colorsBasedMapping?.[d.label] ?? colors.getColor(d.label),
      y,
      height: bandHeight,
      based,
      compared,
      dimmed: anyHighlight && !highlightSet.has(d.label),
      // rowY/rowHeight passed here are the FULL row band (y, bandHeight), not the
      // (possibly half-height, grouped-layout) segments, so the glyph stays
      // centred on the row regardless of layout.
      delta: o.deltaIndicator ? computeComparableDelta(d, based, compared, y, bandHeight, o.deltaIndicator) : undefined,
    };
  });

  return { bars };
}
