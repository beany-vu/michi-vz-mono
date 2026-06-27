import { describe, it, expect } from "vitest";
import { linearFit, linearForecast, holtForecast } from "../src/forecast/methods";
import { accuracyFrom } from "../src/forecast/accuracy";
import { computeForecast } from "../src/forecast/compute";

describe("forecast methods", () => {
  it("linearFit recovers a known line", () => {
    const { slope, intercept } = linearFit([10, 20, 30, 40]);
    expect(slope).toBeCloseTo(10, 6);
    expect(intercept).toBeCloseTo(10, 6);
  });

  it("linearForecast extrapolates a perfect ramp exactly", () => {
    const { predictions } = linearForecast([10, 20, 30, 40], 3);
    expect(predictions).toHaveLength(3);
    expect(predictions[0]).toBeCloseTo(50, 6);
    expect(predictions[1]).toBeCloseTo(60, 6);
    expect(predictions[2]).toBeCloseTo(70, 6);
  });

  it("holtForecast continues an upward trend monotonically", () => {
    const { predictions } = holtForecast([10, 20, 30, 40, 50], 3);
    expect(predictions).toHaveLength(3);
    expect(predictions[0]).toBeGreaterThan(50);
    expect(predictions[1]).toBeGreaterThan(predictions[0]);
    expect(predictions[2]).toBeGreaterThan(predictions[1]);
  });

  it("is deterministic (same input → same output)", () => {
    const a = holtForecast([3, 1, 4, 1, 5, 9, 2, 6], 4);
    const b = holtForecast([3, 1, 4, 1, 5, 9, 2, 6], 4);
    expect(a.predictions).toEqual(b.predictions);
  });
});

describe("accuracy", () => {
  it("computes RMSE/MAE/MAPE", () => {
    const acc = accuracyFrom([100, 200], [110, 180]);
    expect(acc.mae).toBeCloseTo(15, 6); // (10 + 20) / 2
    expect(acc.rmse).toBeCloseTo(Math.sqrt((100 + 400) / 2), 6);
    expect(acc.mape).toBeCloseTo((0.1 + 0.1) / 2 * 100, 6); // 10%
  });

  it("MAPE is null on all-zero actuals (falls back to RMSE/MAE)", () => {
    const acc = accuracyFrom([0, 0], [1, 1]);
    expect(acc.mape).toBeNull();
    expect(acc.rmse).toBeCloseTo(1, 6);
  });
});

describe("computeForecast", () => {
  it("brackets predictions inside a band that widens with horizon", () => {
    const r = computeForecast([5, 7, 6, 9, 8, 11, 10, 13], { method: "holt-winters", horizon: 4 });
    expect(r.predictions).toHaveLength(4);
    for (let h = 0; h < 4; h++) {
      expect(r.lower[h]).toBeLessThanOrEqual(r.predictions[h]);
      expect(r.upper[h]).toBeGreaterThanOrEqual(r.predictions[h]);
    }
    const w0 = r.upper[0] - r.lower[0];
    const w3 = r.upper[3] - r.lower[3];
    expect(w3).toBeGreaterThanOrEqual(w0);
  });

  it("reports ~0 error backtesting a perfectly linear series", () => {
    const r = computeForecast([1, 2, 3, 4, 5, 6, 7, 8, 9], { method: "linear", horizon: 3 });
    expect(r.accuracy.rmse).toBeCloseTo(0, 6);
    expect(r.accuracy.mape ?? 0).toBeCloseTo(0, 6);
  });
});
