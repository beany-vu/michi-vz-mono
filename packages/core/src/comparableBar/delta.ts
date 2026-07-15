// Shared reference implementation of the ComparableHorizontalBar row-level
// delta indicator (arrow + formatted change label). Decision logic ported from
// legacy sdg-trade BarchartVertical/Chart.js (diffStatus/diffColorLabel) - see
// DeltaIndicatorConfig JSDoc (types.ts) for the full contract, including the
// one deliberate divergence (non-inverted good/bad color mapping) and the
// direction convention (diff = valueCompared - valueBased).
import type { ComparableBarDataPoint } from "../types";
import type { ComparableBarSegment } from "./renderModel";

// Hex values read directly from legacy sdg-trade
// src/lib/datadesign-charts/constants/style.js: GREEN = teal['500'], RED = pink['500'].
export const DELTA_GOOD_COLOR = "#009688";
export const DELTA_BAD_COLOR = "#e91e63";
// Legacy BLACK_300. (The legacy chart used two different neutrals - BLACK_400
// for the label text, BLACK_300 for the icon - for a zero diff; this shared
// indicator paints the glyph + label as one unit, so a single neutral covers both.)
export const DELTA_NEUTRAL_COLOR = "#B2B2B2";

// Gap (px) between the end of the longer sub-bar and the delta glyph.
export const DELTA_GAP = 8;

export type ComparableDeltaDirection = "up" | "down" | "flat";

export interface ComparableDeltaModel {
  /** valueCompared - valueBased (see DeltaIndicatorConfig JSDoc). */
  diff: number;
  direction: ComparableDeltaDirection;
  color: string;
  label: string;
  /** Anchor point: just right of the row's longer sub-bar, vertically centred
   * on the FULL row band (layout-independent, unlike the sub-bar segments). */
  x: number;
  y: number;
}

export interface ComparableDeltaGeometryOptions {
  positiveIsGood: boolean;
  positiveIsUp: boolean;
  formatter: (diff: number, d: ComparableBarDataPoint) => string;
}

export function computeComparableDelta(
  d: ComparableBarDataPoint,
  based: ComparableBarSegment,
  compared: ComparableBarSegment,
  rowY: number,
  rowHeight: number,
  o: ComparableDeltaGeometryOptions,
): ComparableDeltaModel {
  const diff = d.valueCompared - d.valueBased;
  let direction: ComparableDeltaDirection = "flat";
  let color = DELTA_NEUTRAL_COLOR;
  if (diff > 0) {
    direction = o.positiveIsUp ? "up" : "down";
    color = o.positiveIsGood ? DELTA_GOOD_COLOR : DELTA_BAD_COLOR;
  } else if (diff < 0) {
    direction = o.positiveIsUp ? "down" : "up";
    color = o.positiveIsGood ? DELTA_BAD_COLOR : DELTA_GOOD_COLOR;
  }
  // "End of the row's bars": the rightmost extent of either sub-bar. Assumes
  // the common non-diverging (>= 0) case the legacy chart itself covers;
  // additional handling for a fully-diverging (negative-valued) chart is out
  // of scope (YAGNI) for this reference implementation.
  const endX = Math.max(based.x + based.width, compared.x + compared.width);
  return {
    diff,
    direction,
    color,
    label: o.formatter(diff, d),
    x: endX + DELTA_GAP,
    y: rowY + rowHeight / 2,
  };
}
