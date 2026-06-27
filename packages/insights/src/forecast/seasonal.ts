// Classical (additive) seasonal decomposition + autocorrelation-based period
// detection. Pure + deterministic — plain TS and Math only, no DOM/deps/randomness.

export interface Decomposition {
  /** centered moving-average trend (edges filled with nearest defined value). */
  trend: number[];
  /** per-phase seasonal component, mean-centered so it sums ~0 over one period. */
  seasonal: number[];
  /** what's left: values - trend - seasonal. */
  residual: number[];
  /** the period used for the decomposition. */
  period: number;
}

/**
 * Sample autocorrelation of `values` at a given `lag` (Pearson-style, using the
 * global mean and variance — the standard estimator). Returns 0 for a degenerate
 * (constant) series.
 */
function autocorrelation(values: number[], lag: number): number {
  const n = values.length;
  if (lag <= 0 || lag >= n) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  let denom = 0;
  for (let i = 0; i < n; i++) {
    const d = values[i] - mean;
    denom += d * d;
  }
  if (denom === 0) return 0;
  let num = 0;
  for (let i = 0; i < n - lag; i++) {
    num += (values[i] - mean) * (values[i + lag] - mean);
  }
  return num / denom;
}

/**
 * Remove a least-squares linear trend (`a + b*i`) from the series. ACF-based
 * period detection is only valid on a (roughly) stationary series: a monotone
 * ramp makes the global-mean ACF decay smoothly with lag and swamp the true
 * seasonal peak, so we detrend first. Returns the input unchanged when it can't
 * fit a line (n < 2 or a degenerate x-design).
 */
function linearDetrend(values: number[]): number[] {
  const n = values.length;
  if (n < 2) return values.slice();
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i;
    sy += values[i];
    sxx += i * i;
    sxy += i * values[i];
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return values.slice();
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return values.map((v, i) => v - (intercept + slope * i));
}

/**
 * Detect the dominant seasonal period via autocorrelation: linearly detrend the
 * series (so a ramp doesn't dominate the ACF), scan lags 2..maxPeriod, and return
 * the one with the highest ACF. If even the best peak is weak (ACF < 0.3) the
 * series isn't clearly periodic, so return 1.
 *
 * @param maxPeriod defaults to min(floor(values.length / 2), 24).
 */
export function detectPeriod(values: number[], maxPeriod?: number): number {
  const n = values.length;
  const cap = maxPeriod ?? Math.min(Math.floor(n / 2), 24);
  if (n < 4 || cap < 2) return 1;

  const detrended = linearDetrend(values);
  let bestLag = 1;
  let bestAcf = -Infinity;
  for (let lag = 2; lag <= cap; lag++) {
    const acf = autocorrelation(detrended, lag);
    if (acf > bestAcf) {
      bestAcf = acf;
      bestLag = lag;
    }
  }
  return bestAcf >= 0.3 ? bestLag : 1;
}

/**
 * Centered moving average with window = `period`. For an even window we average
 * two consecutive simple moving averages (the standard "2xMA" trick) so the result
 * stays aligned to the original index. Undefined edge slots are left as `null`.
 */
function centeredMovingAverage(values: number[], period: number): Array<number | null> {
  const n = values.length;
  const out: Array<number | null> = new Array(n).fill(null);
  if (period < 2 || period > n) return out;

  if (period % 2 === 1) {
    const half = (period - 1) / 2;
    for (let i = half; i < n - half; i++) {
      let sum = 0;
      for (let j = i - half; j <= i + half; j++) sum += values[j];
      out[i] = sum / period;
    }
  } else {
    const half = period / 2;
    // simple MA of width `period` is centered between indices; average two of them
    // (one ending at i, one starting at i) to re-center on integer index i.
    for (let i = half; i < n - half; i++) {
      let sum = 0;
      // window covers i-half .. i+half (period+1 points) with the two ends halved.
      sum += values[i - half] * 0.5;
      for (let j = i - half + 1; j < i + half; j++) sum += values[j];
      sum += values[i + half] * 0.5;
      out[i] = sum / period;
    }
  }
  return out;
}

/** Replace null edge slots with the nearest defined value (forward/backward fill). */
function fillEdges(arr: Array<number | null>): number[] {
  const n = arr.length;
  const out = arr.slice();

  // find first/last defined index
  let firstDefined = -1;
  let lastDefined = -1;
  for (let i = 0; i < n; i++) {
    if (out[i] != null) {
      if (firstDefined === -1) firstDefined = i;
      lastDefined = i;
    }
  }
  if (firstDefined === -1) {
    // nothing defined at all — fall back to zeros
    return new Array(n).fill(0);
  }
  for (let i = 0; i < firstDefined; i++) out[i] = out[firstDefined];
  for (let i = lastDefined + 1; i < n; i++) out[i] = out[lastDefined];
  // any interior nulls (shouldn't happen for a contiguous MA) get nearest-left fill
  for (let i = firstDefined; i <= lastDefined; i++) {
    if (out[i] == null) out[i] = out[i - 1];
  }
  return out as number[];
}

/**
 * Classical additive decomposition:
 *   trend    = centered moving average (window = period), edges filled with nearest;
 *   seasonal = average detrended value (value - trend) per phase, mean-centered so
 *              one period sums to ~0;
 *   residual = values - trend - seasonal.
 *
 * `period` defaults to detectPeriod(values). With period <= 1 there's no seasonal
 * structure, so seasonal is all-zero and trend is the series itself.
 */
export function decompose(values: number[], period?: number): Decomposition {
  const n = values.length;
  const p = period ?? detectPeriod(values);

  if (p <= 1 || p > n) {
    const trend = values.slice();
    const seasonal = new Array(n).fill(0);
    const residual = new Array(n).fill(0);
    return { trend, seasonal, residual, period: p <= 1 ? 1 : p };
  }

  const trend = fillEdges(centeredMovingAverage(values, p));

  // detrended series, then average per phase (index mod period)
  const phaseSum = new Array(p).fill(0);
  const phaseCount = new Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    const detrended = values[i] - trend[i];
    if (Number.isFinite(detrended)) {
      const phase = i % p;
      phaseSum[phase] += detrended;
      phaseCount[phase] += 1;
    }
  }
  const phaseMean = phaseSum.map((s, k) => (phaseCount[k] > 0 ? s / phaseCount[k] : 0));

  // mean-center the seasonal indices so they sum to ~0 over one period
  const grand = phaseMean.reduce((a, b) => a + b, 0) / p;
  const phaseSeasonal = phaseMean.map((m) => m - grand);

  const seasonal = values.map((_, i) => phaseSeasonal[i % p]);
  const residual = values.map((v, i) => v - trend[i] - seasonal[i]);

  return { trend, seasonal, residual, period: p };
}
