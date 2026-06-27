// Trend changepoint detection: find indices where the slope of the series
// structurally shifts. Pure + deterministic — no DOM, no deps, no randomness.
//
// Approach (intentionally simple and explainable):
//   For every candidate split point t in [minSegment .. n - minSegment] we fit
//   an ordinary-least-squares line to values[0..t) and another to values[t..n),
//   then score the split by delta = |slopeAfter - slopeBefore|. A larger delta
//   means the trend bends more sharply at t. We keep only the *local maxima* of
//   that delta curve (a t whose delta is >= both neighbours), drop any that fall
//   below `threshold`, and greedily merge maxima that sit within `minSegment` of
//   each other (keeping the stronger one) so we never report two changepoints on
//   top of one another.
import { linearFit } from "./methods";

export interface Changepoint {
  /** index in `values` where the trend shifts (split point: values[index] starts the "after" segment). */
  index: number;
  /** OLS slope fitted to values[0..index). */
  slopeBefore: number;
  /** OLS slope fitted to values[index..n). */
  slopeAfter: number;
  /** |slopeAfter - slopeBefore| — the strength of the bend. */
  delta: number;
}

export interface ChangepointOptions {
  /** minimum points each side of a split must have (default 3). Also the min gap between two changepoints. */
  minSegment?: number;
  /**
   * minimum delta for a split to count. Default: the standard deviation of the
   * delta curve itself (1.0 * stdev of the candidate slope deltas), which scales
   * with the series and is robust to flat/no-change inputs.
   */
  threshold?: number;
}

/** Population standard deviation. Returns 0 for empty/singleton input. */
function stdev(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const variance = xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
  return Math.sqrt(variance);
}

export function detectChangepoints(values: number[], opts: ChangepointOptions = {}): Changepoint[] {
  const minSegment = Math.max(2, Math.floor(opts.minSegment ?? 3));
  const n = values.length;

  // Need at least two segments of `minSegment` points to even consider a split.
  if (n < minSegment * 2) return [];

  // 1. Score every candidate split t in [minSegment .. n - minSegment].
  const candidates: Changepoint[] = [];
  for (let t = minSegment; t <= n - minSegment; t++) {
    const before = linearFit(values.slice(0, t));
    const after = linearFit(values.slice(t));
    const delta = Math.abs(after.slope - before.slope);
    candidates.push({ index: t, slopeBefore: before.slope, slopeAfter: after.slope, delta });
  }
  if (candidates.length === 0) return [];

  // 2. Threshold: explicit, else 1.0 * stdev of the delta curve (auto-scaling).
  const deltas = candidates.map((c) => c.delta);
  const threshold = opts.threshold ?? stdev(deltas);

  // 3. Keep local maxima of the delta curve that clear the threshold.
  //    For plateaus/ties we keep the FIRST (earliest index) so results are stable.
  const peaks: Changepoint[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const d = candidates[i].delta;
    if (d < threshold || d === 0) continue;
    const prev = i > 0 ? candidates[i - 1].delta : -Infinity;
    const next = i < candidates.length - 1 ? candidates[i + 1].delta : -Infinity;
    // strictly greater than the left neighbour, >= the right neighbour: picks the
    // left edge of a flat plateau exactly once.
    if (d > prev && d >= next) peaks.push(candidates[i]);
  }

  // 4. Merge peaks closer than `minSegment` apart, keeping the stronger delta
  //    (ties keep the earlier index). Sort by index so the gap test is simple.
  peaks.sort((a, b) => a.index - b.index);
  const merged: Changepoint[] = [];
  for (const p of peaks) {
    const last = merged[merged.length - 1];
    if (last && p.index - last.index < minSegment) {
      if (p.delta > last.delta) merged[merged.length - 1] = p;
      continue;
    }
    merged.push(p);
  }

  return merged;
}
