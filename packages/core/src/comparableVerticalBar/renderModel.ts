// Renderer-agnostic ComparableVerticalBar model: per category, two VERTICAL
// sub-bars (valueBased behind, valueCompared in front), both at the SAME x and
// the FULL column bandwidth, diverging from y=0. Overlay-only (no "grouped"
// half-band split - unlike ComparableHorizontalBarChart's optional layout).
import { sanitizeForClassName } from "../math/sanitize";
import type { ComparableBarDataPoint } from "../types";
import type { ComparableVerticalScales } from "./scales";
import type { ComparableColorResolver } from "../comparableBar/colors";
import { computeComparableVerticalDelta } from "./delta";
import type { ComparableDeltaGeometryOptions } from "../comparableBar/delta";
import type { ComparableVerticalDeltaModel } from "./delta";

export interface ComparableVerticalBarSegment {
  x: number;
  width: number;
  y: number;
  height: number;
}

export interface ComparableVerticalBarModel {
  raw: ComparableBarDataPoint;
  label: string;
  safe: string;
  color: string;
  /** Fill for the value-based (rear) sub-bar (colorsBasedMapping, else the row colour). */
  basedColor: string;
  /** Full column band - the (x, width) both sub-bars share. */
  x: number;
  width: number;
  based: ComparableVerticalBarSegment;
  compared: ComparableVerticalBarSegment;
  dimmed: boolean;
  /** Set only when DeltaIndicatorConfig.show is true; undefined is a provable no-op. */
  delta?: ComparableVerticalDeltaModel;
}

export interface ComparableVerticalRenderModel {
  bars: ComparableVerticalBarModel[];
}

export interface BuildComparableVerticalModelOptions {
  highlightItems: string[];
  /** Floor a sub-bar's pixel height so near-zero values stay visible (default 5). */
  minBarHeight?: number;
  /** Per-label colour override for the value-based (rear) sub-bar (legacy colorsBasedMapping). */
  colorsBasedMapping?: Record<string, string>;
  /** Resolved row-level delta indicator geometry options; undefined (the default -
   * prop omitted or `show: false`) computes zero delta geometry (provable no-op). */
  deltaIndicator?: ComparableDeltaGeometryOptions;
}

// FIXED z-order (legacy sdg-trade BarchartVertical/Chart.js: `BarCompare`
// painted first/behind, `Bar` painted second/in front) - unlike the horizontal
// chart's width-dependent swap, valueBased is ALWAYS drawn first (behind,
// hatch-eligible) and valueCompared ALWAYS second (in front, solid).
export const comparableVerticalDrawOrder: readonly ["based", "compared"] = ["based", "compared"];

export function buildComparableVerticalRenderModel(
  points: ComparableBarDataPoint[],
  scales: ComparableVerticalScales,
  colors: ComparableColorResolver,
  o: BuildComparableVerticalModelOptions
): ComparableVerticalRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;
  const zero = scales.yScale(0);
  const bandwidth = scales.xScale.bandwidth();
  const minH = o.minBarHeight ?? 5;

  const seg = (v: number, x: number): ComparableVerticalBarSegment => {
    const py = scales.yScale(v);
    const height = Math.abs(py - zero);
    // Floor non-zero heights so a near-zero value isn't a sub-pixel invisible
    // bar; a literal zero stays zero (no phantom bar at the baseline).
    return { x, width: bandwidth, y: Math.min(zero, py), height: height === 0 ? 0 : Math.max(height, minH) };
  };

  const bars: ComparableVerticalBarModel[] = points.map((d) => {
    const x = scales.xScale(d.label) ?? 0;
    const based = seg(d.valueBased, x);
    const compared = seg(d.valueCompared, x);
    return {
      raw: d,
      label: d.label,
      safe: sanitizeForClassName(d.label),
      color: colors.getColor(d.label),
      basedColor: o.colorsBasedMapping?.[d.label] ?? colors.getColor(d.label),
      x,
      width: bandwidth,
      based,
      compared,
      dimmed: anyHighlight && !highlightSet.has(d.label),
      delta: o.deltaIndicator
        ? computeComparableVerticalDelta(d, based, compared, x, bandwidth, o.deltaIndicator)
        : undefined,
    };
  });

  return { bars };
}
