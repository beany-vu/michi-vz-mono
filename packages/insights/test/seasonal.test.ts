import { describe, it, expect } from "vitest";
import { detectPeriod, decompose } from "../src/forecast/seasonal";

// A clean additive signal: a linear trend plus a period-4 seasonal pattern.
const PATTERN = [0, 5, 0, -5];
function makeSeries(length: number, slope = 1.0): number[] {
  return Array.from({ length }, (_, i) => i * slope + PATTERN[i % PATTERN.length]);
}

// Deterministic, genuinely aperiodic noise via a seeded PRNG (mulberry32) — NOT
// the simple alternating sequence, which is actually a clean period-2/4 signal
// (ACF at lag 4 ~ 0.60) and so should detect a period, not 1.
function seededNoise(length: number, seed = 1337): number[] {
  let s = seed >>> 0;
  const rng = (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length }, () => rng() * 2 - 1);
}

describe("detectPeriod", () => {
  it("detects a period-4 seasonal cycle", () => {
    // remove the trend so autocorrelation isn't dominated by the ramp
    const seasonal = Array.from({ length: 40 }, (_, i) => PATTERN[i % 4]);
    expect(detectPeriod(seasonal)).toBe(4);
  });

  it("detects a period-12 cycle", () => {
    const seasonal = Array.from({ length: 72 }, (_, i) => Math.sin((2 * Math.PI * i) / 12));
    expect(detectPeriod(seasonal)).toBe(12);
  });

  it("returns 1 for a non-periodic series", () => {
    const ramp = Array.from({ length: 20 }, (_, i) => i);
    // genuinely aperiodic (seeded) noise has no clear ACF peak -> 1
    const noise = seededNoise(30);
    expect(detectPeriod(noise)).toBe(1);
    // a pure ramp is detrended to ~0 before the ACF scan, so it is degenerate -> 1
    expect(detectPeriod(ramp)).toBe(1);
  });

  it("respects an explicit maxPeriod", () => {
    const seasonal = Array.from({ length: 60 }, (_, i) => PATTERN[i % 4]);
    expect(detectPeriod(seasonal, 3)).toBeGreaterThanOrEqual(1);
    expect(detectPeriod(seasonal, 3)).toBeLessThanOrEqual(3);
  });

  it("is deterministic", () => {
    const s = makeSeries(48);
    expect(detectPeriod(s)).toBe(detectPeriod(s));
  });
});

describe("decompose", () => {
  it("recovers the seasonal pattern of a trend+season series", () => {
    const values = makeSeries(48); // period-4 season [0,5,0,-5] on a slope-1 ramp
    const d = decompose(values);

    expect(d.period).toBe(4);
    expect(d.trend).toHaveLength(values.length);
    expect(d.seasonal).toHaveLength(values.length);
    expect(d.residual).toHaveLength(values.length);

    // seasonal indices should match the injected pattern (mean-centered, which it
    // already is: [0,5,0,-5] sums to 0) within ~1.
    expect(d.seasonal[0]).toBeCloseTo(0, 0);
    expect(d.seasonal[1]).toBeCloseTo(5, 0);
    expect(d.seasonal[2]).toBeCloseTo(0, 0);
    expect(d.seasonal[3]).toBeCloseTo(-5, 0);
  });

  it("produces a seasonal component that sums to ~0 over one period", () => {
    const values = makeSeries(48);
    const d = decompose(values);
    const oneCycle = d.seasonal.slice(0, d.period).reduce((a, b) => a + b, 0);
    expect(oneCycle).toBeCloseTo(0, 6);
  });

  it("reconstructs the original series: trend + seasonal + residual = values", () => {
    const values = makeSeries(48);
    const d = decompose(values);
    for (let i = 0; i < values.length; i++) {
      expect(d.trend[i] + d.seasonal[i] + d.residual[i]).toBeCloseTo(values[i], 6);
    }
  });

  it("leaves small residuals on a clean additive signal (interior region)", () => {
    const values = makeSeries(48);
    const d = decompose(values);
    // away from the edges the centered MA tracks the ramp, so residual ~ 0
    for (let i = 8; i < values.length - 8; i++) {
      expect(Math.abs(d.residual[i])).toBeLessThan(1);
    }
  });

  it("respects an explicit period override", () => {
    const values = makeSeries(48);
    const d = decompose(values, 4);
    expect(d.period).toBe(4);
  });

  it("returns a flat (zero) seasonal when there's no detectable period", () => {
    const values = seededNoise(20);
    const d = decompose(values, 1);
    expect(d.period).toBe(1);
    expect(d.seasonal.every((s) => s === 0)).toBe(true);
    expect(d.trend).toEqual(values);
  });

  it("auto-detects period 1 (flat seasonal) for genuinely aperiodic data", () => {
    const values = seededNoise(30);
    const d = decompose(values); // no explicit period -> uses detectPeriod
    expect(d.period).toBe(1);
    expect(d.seasonal.every((s) => s === 0)).toBe(true);
  });

  it("is deterministic (same input → same output)", () => {
    const values = makeSeries(40);
    const a = decompose(values);
    const b = decompose(values);
    expect(a.trend).toEqual(b.trend);
    expect(a.seasonal).toEqual(b.seasonal);
    expect(a.residual).toEqual(b.residual);
    expect(a.period).toBe(b.period);
  });

  it("handles an odd period (centered MA with odd window)", () => {
    const pattern = [0, 3, -3];
    const values = Array.from({ length: 36 }, (_, i) => i * 0.5 + pattern[i % 3]);
    const d = decompose(values, 3);
    expect(d.period).toBe(3);
    const oneCycle = d.seasonal.slice(0, 3).reduce((a, b) => a + b, 0);
    expect(oneCycle).toBeCloseTo(0, 6);
    expect(d.seasonal[1] - d.seasonal[2]).toBeCloseTo(6, 0); // 3 - (-3)
  });
});
