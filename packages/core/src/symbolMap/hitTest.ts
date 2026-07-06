// SymbolMap forgiving hover hit-test (B3.7). Shared by the canvas/webgpu
// host-level listener (engine/symbolMapChart.ts's `onHostMove`) AND the SVG
// renderer's per-mark invisible hit target (renderSvg.ts) - one definition of
// "how big is this mark's hit target" for both paths.
//
// Bug this fixes: a strict `dist <= r` circle containment test "works in
// principle" but is practically unhittable for small marks - a value-scaled
// dot can render at only 3-5px radius (this chart's `radiusRange` default
// floor is 3), well under real pointer precision. Mirrors RadarChart's
// forgiving-hover precedent (`NEAREST_VERTEX_SNAP` in
// radarChart/renderCanvas.ts): floor every mark's hit radius to
// SYMBOL_MIN_HIT_RADIUS, and when a pointer falls within more than one mark's
// (now-larger) hit radius - e.g. a tiny dot sitting near a much bigger bubble
// - the NEAREST one wins, by distance normalized to each mark's own effective
// radius (so a dead-center hit on a small dot always beats a merely-nearby
// big bubble, even though the big bubble's absolute distance is smaller).
export const SYMBOL_MIN_HIT_RADIUS = 8;

export interface HittableSymbol {
  x: number;
  y: number;
  radius: number;
  radiusSecond: number | null;
}

/** The larger of the primary/secondary circle, floored to SYMBOL_MIN_HIT_RADIUS.
 * Equals the mark's own visible radius (no-op) once that radius already meets
 * the floor - large bubbles are never given extra padding. */
export function symbolEffectiveHitRadius(m: HittableSymbol): number {
  const real = m.radiusSecond != null ? Math.max(m.radius, m.radiusSecond) : m.radius;
  return Math.max(real, SYMBOL_MIN_HIT_RADIUS);
}

/**
 * Forgiving, nearest-match-wins hit-test: returns the mark whose effective hit
 * radius contains (mx, my) with the smallest distance/effectiveRadius ratio,
 * or null when no mark qualifies. Iteration order does not matter (every
 * candidate is scored, not first-match).
 */
export function pickNearestSymbolHit<T extends HittableSymbol>(symbols: T[], mx: number, my: number): T | null {
  let best: T | null = null;
  let bestScore = Infinity;
  for (const m of symbols) {
    const r = symbolEffectiveHitRadius(m);
    const dx = mx - m.x;
    const dy = my - m.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > r) continue;
    const score = d / r;
    if (score < bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
