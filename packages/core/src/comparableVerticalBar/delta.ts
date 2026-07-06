// ComparableVerticalBar row-level delta indicator: decision logic + vertical
// geometry. Reuses the color constants + the ComparableDeltaGeometryOptions
// contract from the reference implementation (comparableBar/delta.ts, first
// landed on ComparableHorizontalBarChart - see DeltaIndicatorConfig JSDoc in
// types.ts for the full contract) so both charts share ONE decision table.
//
// Geometry ported from legacy sdg-trade BarchartVertical/Chart.js: the glyph +
// label sit ABOVE the taller of the two columns, offset `translate(bandwidth/3,
// -32)` - not centred on the band. The label sits `y=25` below the glyph's
// local origin inside that translated group (`LabelValue y={25}`), so the
// label reads just above the bar, with the glyph further above it.
import { DELTA_GOOD_COLOR, DELTA_BAD_COLOR, DELTA_NEUTRAL_COLOR } from "../comparableBar/delta";
import type { ComparableDeltaDirection, ComparableDeltaGeometryOptions } from "../comparableBar/delta";
import type { ComparableBarDataPoint } from "../types";
import type { ComparableVerticalBarSegment } from "./renderModel";

export { DELTA_GOOD_COLOR, DELTA_BAD_COLOR, DELTA_NEUTRAL_COLOR };
export type { ComparableDeltaDirection, ComparableDeltaGeometryOptions };

/** Vertical gap (px) between the top of the taller column and the glyph -
 * ported from legacy `translate(bandwidth/3, -32)`. */
export const DELTA_GAP_Y = 32;
/** Offset (px, downward) from the glyph anchor to the label baseline - ported
 * from legacy `LabelValue y={25}` (measured from the same local origin). */
export const DELTA_LABEL_OFFSET_Y = 25;
/** Horizontal placement fraction of the bandwidth - ported verbatim from legacy
 * `translate(bandwidth/3, -32)` (NOT centred on the column). */
export const DELTA_X_FRACTION = 1 / 3;

export interface ComparableVerticalDeltaModel {
  /** valueCompared - valueBased (see DeltaIndicatorConfig JSDoc). */
  diff: number;
  direction: ComparableDeltaDirection;
  color: string;
  label: string;
  /** Glyph (arrow) anchor. */
  x: number;
  y: number;
  /** Label anchor, below the glyph. */
  labelX: number;
  labelY: number;
}

/** The shared sign/color decision table (diff > 0 / < 0 / === 0), factored out
 * so both the geometry (below) and the context builder (which reflects the
 * indicator on `series[].deltaDirection/deltaColor` - unlike the horizontal
 * chart, this chart owns that use case) apply IDENTICAL logic. */
export function resolveDeltaDirectionColor(
  diff: number,
  o: ComparableDeltaGeometryOptions
): { direction: ComparableDeltaDirection; color: string } {
  if (diff > 0) {
    return {
      direction: o.positiveIsUp ? "up" : "down",
      color: o.positiveIsGood ? DELTA_GOOD_COLOR : DELTA_BAD_COLOR,
    };
  }
  if (diff < 0) {
    return {
      direction: o.positiveIsUp ? "down" : "up",
      color: o.positiveIsGood ? DELTA_BAD_COLOR : DELTA_GOOD_COLOR,
    };
  }
  return { direction: "flat", color: DELTA_NEUTRAL_COLOR };
}

export function computeComparableVerticalDelta(
  d: ComparableBarDataPoint,
  based: ComparableVerticalBarSegment,
  compared: ComparableVerticalBarSegment,
  columnX: number,
  bandwidth: number,
  o: ComparableDeltaGeometryOptions
): ComparableVerticalDeltaModel {
  const diff = d.valueCompared - d.valueBased;
  const { direction, color } = resolveDeltaDirectionColor(diff, o);
  // Top (smallest pixel-y) of the taller sub-bar - the group's local origin in
  // the legacy chart (`y = innerHeight - maxHeight`).
  const topY = Math.min(based.y, compared.y);
  const x = columnX + bandwidth * DELTA_X_FRACTION;
  const y = topY - DELTA_GAP_Y;
  return {
    diff,
    direction,
    color,
    label: o.formatter(diff, d),
    x,
    y,
    labelX: x,
    labelY: y + DELTA_LABEL_OFFSET_Y,
  };
}
