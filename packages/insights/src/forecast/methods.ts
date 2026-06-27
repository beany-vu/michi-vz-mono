// Pure forecasting methods. No DOM, no deps, fully deterministic — easy to test.
// Each returns the next `horizon` point forecasts plus the in-sample one-step-ahead
// fitted values (used to size the confidence band and the accuracy metrics).

export interface FitResult {
  /** point forecasts for the next `horizon` steps. */
  predictions: number[];
  /** in-sample one-step-ahead fitted values (length depends on method). */
  fitted: number[];
  /** index in `values` that `fitted[0]` aligns to (0 for linear, 1 for Holt). */
  fittedOffset: number;
}

/** Ordinary least squares of value over its index. */
export function linearFit(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: values[0] };
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
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

export function linearForecast(values: number[], horizon: number): FitResult {
  const { slope, intercept } = linearFit(values);
  const n = values.length;
  const predictions = Array.from({ length: horizon }, (_, h) => slope * (n + h) + intercept);
  const fitted = values.map((_, i) => slope * i + intercept);
  return { predictions, fitted, fittedOffset: 0 };
}

/**
 * Holt's linear-trend (double exponential smoothing). Level + trend updated each
 * step; the h-step forecast is level + h*trend. This is the "Holt-Winters" entry
 * without the seasonal term (seasonality lands in Phase 7.2).
 */
export function holtForecast(
  values: number[],
  horizon: number,
  alpha = 0.5,
  beta = 0.3
): FitResult {
  const n = values.length;
  if (n === 0) return { predictions: Array.from({ length: horizon }, () => 0), fitted: [], fittedOffset: 1 };
  if (n === 1)
    return { predictions: Array.from({ length: horizon }, () => values[0]), fitted: [], fittedOffset: 1 };

  let level = values[0];
  let trend = values[1] - values[0];
  const fitted: number[] = [];
  for (let t = 1; t < n; t++) {
    fitted.push(level + trend); // one-step forecast of y_t before observing it
    const newLevel = alpha * values[t] + (1 - alpha) * (level + trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
    level = newLevel;
    trend = newTrend;
  }
  const predictions = Array.from({ length: horizon }, (_, h) => level + (h + 1) * trend);
  return { predictions, fitted, fittedOffset: 1 };
}
