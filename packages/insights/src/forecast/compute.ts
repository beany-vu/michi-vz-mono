// Orchestrates a forecast: pick a method, build the confidence band from residual
// spread, and measure accuracy by a rolling holdout backtest (falling back to
// in-sample one-step error on short series). Pure + deterministic.
import { holtForecast, linearForecast, type FitResult } from "./methods";
import { accuracyFrom, type Accuracy } from "./accuracy";

export type ForecastMethod = "holt-winters" | "linear";

export interface ForecastOptions {
  method?: ForecastMethod;
  horizon: number;
  /** primary confidence level for the band, e.g. 0.95. */
  level?: number;
  /** extra nested levels for a fan chart, e.g. [0.5, 0.8, 0.95]. */
  levels?: number[];
}

export interface ForecastBand {
  level: number;
  lower: number[];
  upper: number[];
}

export interface ForecastResult {
  method: ForecastMethod;
  horizon: number;
  level: number;
  /** point forecasts. */
  predictions: number[];
  /** lower band edge per step at the primary level (grows with horizon). */
  lower: number[];
  /** upper band edge per step at the primary level. */
  upper: number[];
  /** nested bands (one per requested level), widest last — for a fan chart. */
  bands: ForecastBand[];
  /** residual standard error (band half-width per sqrt-step before the z-multiplier). */
  se: number;
  accuracy: Accuracy;
}

// z-multipliers for common two-sided confidence levels.
const Z: Array<[number, number]> = [
  [0.5, 0.674],
  [0.8, 1.282],
  [0.9, 1.645],
  [0.95, 1.96],
  [0.99, 2.576],
];

function zFor(level: number): number {
  let best = Z[Z.length - 1];
  let bestDiff = Infinity;
  for (const entry of Z) {
    const diff = Math.abs(entry[0] - level);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = entry;
    }
  }
  return best[1];
}

function run(method: ForecastMethod, values: number[], horizon: number): FitResult {
  return method === "linear" ? linearForecast(values, horizon) : holtForecast(values, horizon);
}

function residualStd(values: number[], fit: FitResult): number {
  const resid: number[] = [];
  for (let i = 0; i < fit.fitted.length; i++) {
    const actual = values[i + fit.fittedOffset];
    if (Number.isFinite(actual)) resid.push(actual - fit.fitted[i]);
  }
  if (resid.length === 0) return 0;
  const mean = resid.reduce((a, b) => a + b, 0) / resid.length;
  const variance = resid.reduce((a, b) => a + (b - mean) * (b - mean), 0) / resid.length;
  return Math.sqrt(variance);
}

/** Hold out the last k points, fit on the rest, score the forecast. */
function backtest(method: ForecastMethod, values: number[], horizon: number): Accuracy | null {
  const n = values.length;
  const k = Math.min(horizon, Math.floor(n / 3));
  if (n < 6 || k < 1) return null;
  const train = values.slice(0, n - k);
  const test = values.slice(n - k);
  return accuracyFrom(test, run(method, train, k).predictions);
}

export function computeForecast(values: number[], opts: ForecastOptions): ForecastResult {
  const method = opts.method ?? "holt-winters";
  const horizon = Math.max(1, Math.floor(opts.horizon));
  const level = opts.level ?? 0.95;

  const fit = run(method, values, horizon);
  const se = residualStd(values, fit);

  const bandFor = (lv: number): ForecastBand => {
    const z = zFor(lv);
    return {
      level: lv,
      lower: fit.predictions.map((p, h) => p - z * se * Math.sqrt(h + 1)),
      upper: fit.predictions.map((p, h) => p + z * se * Math.sqrt(h + 1)),
    };
  };

  // nested bands, widest last (so a fan can paint lightest→widest underneath)
  const levels = Array.from(new Set([...(opts.levels ?? []), level])).sort((a, b) => a - b);
  const bands = levels.map(bandFor);
  const primary = bandFor(level);

  const inSample = accuracyFrom(values.slice(fit.fittedOffset), fit.fitted);
  const accuracy = backtest(method, values, horizon) ?? inSample;

  return {
    method,
    horizon,
    level,
    predictions: fit.predictions,
    lower: primary.lower,
    upper: primary.upper,
    bands,
    se,
    accuracy,
  };
}
