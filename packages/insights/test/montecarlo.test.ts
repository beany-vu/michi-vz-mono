import { describe, it, expect } from "vitest";
import { monteCarloForecast } from "../src/forecast/montecarlo";
import { computeForecast } from "../src/forecast/compute";

const UP = [5, 7, 6, 9, 8, 11, 10, 13, 12, 15];

describe("monteCarloForecast", () => {
  it("returns predictions of length === horizon", () => {
    const r = monteCarloForecast(UP, { horizon: 4, seed: 42 });
    expect(r.predictions).toHaveLength(4);
    expect(r.lower).toHaveLength(4);
    expect(r.upper).toHaveLength(4);
    expect(r.runs).toBe(500);
  });

  it("respects an explicit runs count", () => {
    const r = monteCarloForecast(UP, { horizon: 3, runs: 200, seed: 7 });
    expect(r.runs).toBe(200);
  });

  it("brackets predictions: lower <= predictions <= upper elementwise", () => {
    const r = monteCarloForecast(UP, { horizon: 5, runs: 1000, seed: 11 });
    for (let h = 0; h < 5; h++) {
      expect(r.lower[h]).toBeLessThanOrEqual(r.predictions[h]);
      expect(r.upper[h]).toBeGreaterThanOrEqual(r.predictions[h]);
    }
  });

  it("band widens with horizon (noise scales with sqrt-step)", () => {
    const r = monteCarloForecast(UP, { horizon: 5, runs: 2000, seed: 3 });
    const w0 = r.upper[0] - r.lower[0];
    const w4 = r.upper[4] - r.lower[4];
    expect(w4).toBeGreaterThan(w0);
  });

  it("for an upward series, probabilityAbove(lowTarget) ~ 1 and below ~ 0", () => {
    const r = monteCarloForecast(UP, { horizon: 4, runs: 2000, seed: 99 });
    const lowTarget = 0; // well below any plausible future of an upward ramp
    expect(r.probabilityAbove(lowTarget)).toBeCloseTo(1, 2);
    expect(r.probabilityBelow(lowTarget)).toBeCloseTo(0, 2);
  });

  it("probabilityAbove + probabilityBelow ~ 1 for a target unlikely to be hit exactly", () => {
    const r = monteCarloForecast(UP, { horizon: 4, runs: 1000, seed: 5 });
    const t = r.predictions[3];
    expect(r.probabilityAbove(t) + r.probabilityBelow(t)).toBeCloseTo(1, 2);
  });

  it("is deterministic: same seed → identical predictions/bands/finals", () => {
    const a = monteCarloForecast(UP, { horizon: 4, runs: 300, seed: 1234 });
    const b = monteCarloForecast(UP, { horizon: 4, runs: 300, seed: 1234 });
    expect(a.predictions).toEqual(b.predictions);
    expect(a.lower).toEqual(b.lower);
    expect(a.upper).toEqual(b.upper);
    expect(a.probabilityAbove(10)).toBe(b.probabilityAbove(10));
    expect(a.probabilityBelow(10)).toBe(b.probabilityBelow(10));
  });

  it("different seeds → different predictions (the sim actually varies)", () => {
    const a = monteCarloForecast(UP, { horizon: 4, runs: 300, seed: 1 });
    const b = monteCarloForecast(UP, { horizon: 4, runs: 300, seed: 2 });
    expect(a.predictions).not.toEqual(b.predictions);
  });

  it("mean of runs stays near the deterministic base forecast", () => {
    // With many runs, zero-mean Gaussian noise averages out, so the Monte Carlo
    // mean should sit close to the underlying point forecast at step 0.
    const r = monteCarloForecast(UP, { horizon: 3, runs: 5000, seed: 2024 });
    const base = computeForecast(UP, { method: "holt-winters", horizon: 3, level: 0.95 });
    // step-0 noise is the smallest (sd = se/sqrt(runs)); the empirical mean should
    // sit within a tight tolerance of the deterministic point forecast. Measured
    // diff for this seed is ~2e-4, so toBeCloseTo(.,1) (|diff| < 0.05) is robust.
    expect(r.predictions[0]).toBeCloseTo(base.predictions[0], 1);
  });

  it("defaults seed to 1 when omitted (deterministic without explicit seed)", () => {
    const a = monteCarloForecast(UP, { horizon: 3 });
    const b = monteCarloForecast(UP, { horizon: 3, seed: 1 });
    expect(a.predictions).toEqual(b.predictions);
  });
});
