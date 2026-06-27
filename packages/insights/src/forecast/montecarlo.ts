// Monte Carlo forecast simulation. Take the deterministic point forecast from
// computeForecast as the centre path, then run many simulated futures: each step
// is perturbed by Gaussian residual noise scaled by se*sqrt(step). Mean of the
// runs is the forecast; empirical quantiles give the band; final-step tallies give
// exceedance probabilities. Pure + deterministic via a seeded mulberry32 PRNG.
import { computeForecast, type ForecastMethod } from "./compute";

export interface MonteCarloResult {
  /** mean point forecast across all runs (length === horizon). */
  predictions: number[];
  /** lower empirical-quantile band edge per step. */
  lower: number[];
  /** upper empirical-quantile band edge per step. */
  upper: number[];
  /** number of simulated futures. */
  runs: number;
  /** fraction of runs whose final value finished strictly above `target`. */
  probabilityAbove(target: number): number;
  /** fraction of runs whose final value finished strictly below `target`. */
  probabilityBelow(target: number): number;
}

export interface MonteCarloOptions {
  horizon: number;
  /** number of simulated futures (default 500). */
  runs?: number;
  /** PRNG seed for reproducibility (default 1). */
  seed?: number;
  /** central probability mass kept inside the band (default 0.95). */
  level?: number;
  method?: ForecastMethod;
}

/** mulberry32 — a tiny, fast, deterministic 32-bit PRNG. Returns floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller: turn two uniforms into one standard-normal sample. */
function gaussian(rng: () => number): number {
  let u1 = rng();
  // guard against log(0)
  if (u1 < 1e-12) u1 = 1e-12;
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Linear-interpolated empirical quantile of an already-sorted array. */
function quantileSorted(sorted: number[], q: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0];
  const pos = (n - 1) * Math.min(1, Math.max(0, q));
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const frac = pos - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

export function monteCarloForecast(
  values: number[],
  opts: MonteCarloOptions
): MonteCarloResult {
  const horizon = Math.max(1, Math.floor(opts.horizon));
  const runs = Math.max(1, Math.floor(opts.runs ?? 500));
  const seed = opts.seed ?? 1;
  const level = opts.level ?? 0.95;
  const method = opts.method ?? "holt-winters";

  const base = computeForecast(values, { method, horizon, level });
  const se = base.se;
  const rng = mulberry32(seed);

  // sims[h] holds the `runs` simulated values for step h.
  const sims: number[][] = Array.from({ length: horizon }, () => new Array<number>(runs));
  const finals = new Array<number>(runs);

  for (let r = 0; r < runs; r++) {
    for (let h = 0; h < horizon; h++) {
      // noise grows with sqrt of step (steps are 1-indexed), matching the band model.
      const noise = gaussian(rng) * se * Math.sqrt(h + 1);
      const v = base.predictions[h] + noise;
      sims[h][r] = v;
    }
    finals[r] = sims[horizon - 1][r];
  }

  const predictions = new Array<number>(horizon);
  const lower = new Array<number>(horizon);
  const upper = new Array<number>(horizon);
  const qLo = (1 - level) / 2;
  const qHi = (1 + level) / 2;

  for (let h = 0; h < horizon; h++) {
    const col = sims[h];
    let sum = 0;
    for (let r = 0; r < runs; r++) sum += col[r];
    predictions[h] = sum / runs;

    const sorted = col.slice().sort((a, b) => a - b);
    lower[h] = quantileSorted(sorted, qLo);
    upper[h] = quantileSorted(sorted, qHi);
  }

  const probabilityAbove = (target: number): number => {
    let count = 0;
    for (let r = 0; r < runs; r++) if (finals[r] > target) count++;
    return count / runs;
  };
  const probabilityBelow = (target: number): number => {
    let count = 0;
    for (let r = 0; r < runs; r++) if (finals[r] < target) count++;
    return count / runs;
  };

  return { predictions, lower, upper, runs, probabilityAbove, probabilityBelow };
}
