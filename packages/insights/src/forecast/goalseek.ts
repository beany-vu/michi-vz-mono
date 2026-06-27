// Goal-seek + pacing: the inverse of forecasting. Given a known target, work out
// what growth/run-rate is needed, or extrapolate the current pace to a finish line.
// Pure + deterministic — plain arithmetic, no DOM, no deps, no randomness.

/**
 * Constant per-period multiplicative growth rate `g` such that
 * `current * (1 + g) ** periods === target`.
 * Returns 0 when `current <= 0` or `periods <= 0` (no well-defined ratio).
 */
export function requiredGrowth(current: number, target: number, periods: number): number {
  if (current <= 0 || periods <= 0) return 0;
  return Math.pow(target / current, 1 / periods) - 1;
}

/**
 * Constant per-period ADDITIVE increment needed to move from `current` to
 * `target` over `periods` steps. Returns 0 when `periods <= 0`.
 */
export function requiredRunRate(current: number, target: number, periods: number): number {
  if (periods <= 0) return 0;
  return (target - current) / periods;
}

export interface Pacing {
  /** linear run-rate extrapolation of the cumulative total to the end of the window. */
  projected: number;
  /** projected / target * 100. */
  attainmentPct: number;
  /** true when the projected finish meets or beats the target. */
  onTrack: boolean;
  /** additive amount needed per remaining period to still land on target. */
  requiredRunRate: number;
}

/**
 * Pace a running cumulative total against a goal. Projects the current run-rate
 * across the full window, then computes how much per remaining period is still
 * required to hit `target`.
 */
export function pacingToGoal(
  cumulative: number,
  target: number,
  periodsElapsed: number,
  periodsTotal: number
): Pacing {
  const projected =
    periodsElapsed > 0 ? (cumulative / periodsElapsed) * periodsTotal : 0;
  const attainmentPct = target !== 0 ? (projected / target) * 100 : 0;
  const onTrack = projected >= target;
  const periodsRemaining = periodsTotal - periodsElapsed;
  const required = requiredRunRate(cumulative, target, periodsRemaining);
  return { projected, attainmentPct, onTrack, requiredRunRate: required };
}
