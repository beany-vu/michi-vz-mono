// Forecast accuracy metrics. MAPE is the intuitive default but is unstable on
// zero/intermittent actuals, so it is null when no non-zero actual exists — callers
// fall back to RMSE/MAE there (per the plan's honest-metric note).

export interface Accuracy {
  /** Mean Absolute Percentage Error (%), or null when undefined (all-zero actuals). */
  mape: number | null;
  /** Root Mean Squared Error. */
  rmse: number;
  /** Mean Absolute Error. */
  mae: number;
  /** number of compared points. */
  n: number;
}

export function accuracyFrom(actual: number[], predicted: number[]): Accuracy {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return { mape: null, rmse: 0, mae: 0, n: 0 };
  let se = 0;
  let ae = 0;
  let ape = 0;
  let apeCount = 0;
  for (let i = 0; i < n; i++) {
    const err = actual[i] - predicted[i];
    se += err * err;
    ae += Math.abs(err);
    if (actual[i] !== 0) {
      ape += Math.abs(err / actual[i]);
      apeCount++;
    }
  }
  return {
    mape: apeCount > 0 ? (ape / apeCount) * 100 : null,
    rmse: Math.sqrt(se / n),
    mae: ae / n,
    n,
  };
}
