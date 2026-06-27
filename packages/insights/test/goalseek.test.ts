import { describe, it, expect } from "vitest";
import {
  requiredGrowth,
  requiredRunRate,
  pacingToGoal,
} from "../src/forecast/goalseek";

describe("requiredGrowth", () => {
  it("finds the per-period multiplicative growth to a target", () => {
    // 100 * 1.1^2 = 121
    expect(requiredGrowth(100, 121, 2)).toBeCloseTo(0.1, 9);
  });

  it("round-trips: applying the growth reaches the target", () => {
    const g = requiredGrowth(50, 200, 4);
    expect(50 * Math.pow(1 + g, 4)).toBeCloseTo(200, 6);
  });

  it("handles a flat target as zero growth", () => {
    expect(requiredGrowth(100, 100, 3)).toBeCloseTo(0, 9);
  });

  it("returns 0 when current <= 0", () => {
    expect(requiredGrowth(0, 100, 5)).toBe(0);
    expect(requiredGrowth(-10, 100, 5)).toBe(0);
  });

  it("returns 0 when periods <= 0", () => {
    expect(requiredGrowth(100, 200, 0)).toBe(0);
    expect(requiredGrowth(100, 200, -2)).toBe(0);
  });

  it("is deterministic (same input → same output)", () => {
    expect(requiredGrowth(73, 251, 6)).toBe(requiredGrowth(73, 251, 6));
  });
});

describe("requiredRunRate", () => {
  it("computes the additive increment to a target", () => {
    expect(requiredRunRate(0, 100, 10)).toBe(10);
  });

  it("subtracts the current value from the target before splitting", () => {
    expect(requiredRunRate(40, 100, 6)).toBeCloseTo(10, 9);
  });

  it("can be negative when the target is below current", () => {
    expect(requiredRunRate(100, 50, 5)).toBeCloseTo(-10, 9);
  });

  it("returns 0 when periods <= 0", () => {
    expect(requiredRunRate(0, 100, 0)).toBe(0);
    expect(requiredRunRate(0, 100, -3)).toBe(0);
  });
});

describe("pacingToGoal", () => {
  it("projects the current run-rate to the end of the window", () => {
    const p = pacingToGoal(50, 100, 5, 10);
    expect(p.projected).toBeCloseTo(100, 9);
    expect(p.attainmentPct).toBeCloseTo(100, 9);
    expect(p.onTrack).toBe(true);
    // already exactly on pace → 50 more over the remaining 5 periods = 10/period
    expect(p.requiredRunRate).toBeCloseTo(10, 9);
  });

  it("flags a slow pace as not on track and asks for a higher run-rate", () => {
    // only 30 after half the window, target 100
    const p = pacingToGoal(30, 100, 5, 10);
    expect(p.projected).toBeCloseTo(60, 9);
    expect(p.attainmentPct).toBeCloseTo(60, 9);
    expect(p.onTrack).toBe(false);
    // need 70 more over the remaining 5 periods = 14/period
    expect(p.requiredRunRate).toBeCloseTo(14, 9);
  });

  it("flags a fast pace as on track and over 100% attainment", () => {
    const p = pacingToGoal(80, 100, 5, 10);
    expect(p.projected).toBeCloseTo(160, 9);
    expect(p.attainmentPct).toBeCloseTo(160, 9);
    expect(p.onTrack).toBe(true);
  });

  it("returns a zero projection when no periods have elapsed", () => {
    const p = pacingToGoal(0, 100, 0, 10);
    expect(p.projected).toBe(0);
    expect(p.onTrack).toBe(false);
    // full target still required over the full window
    expect(p.requiredRunRate).toBeCloseTo(10, 9);
  });

  it("is deterministic (same input → same output)", () => {
    const a = pacingToGoal(37, 120, 4, 9);
    const b = pacingToGoal(37, 120, 4, 9);
    expect(a).toEqual(b);
  });
});
