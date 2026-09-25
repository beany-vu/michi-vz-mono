// Corner radius for the comparable bar charts (horizontal + vertical). One
// resolver for the `barRadius` prop and ONE clamp shared by the svg renderer
// (rx/ry) and the canvas renderer (roundRect / arcTo), so the two can never
// round a thin bar differently.

/** The legacy look: every comparable bar has always been drawn with 5px corners. */
export const DEFAULT_BAR_RADIUS = 5;

/**
 * Resolve the `barRadius` prop. Negative values floor to 0 (square corners);
 * NaN falls back to the default. `Infinity` is kept: after clamping it gives
 * fully rounded ends.
 */
export function resolveBarRadius(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return DEFAULT_BAR_RADIUS;
  return Math.max(0, value);
}

/**
 * The radius actually drawn on a `width` x `height` bar: never more than half
 * the bar's width or height (by magnitude), never negative.
 */
export function clampBarRadius(radius: number, width: number, height: number): number {
  return Math.max(0, Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2));
}
