import { describe, it, expect } from "vitest";
import { detectChangepoints } from "../src/forecast/changepoint";

describe("detectChangepoints", () => {
  it("finds one changepoint near index 4 on a ramp-then-flat series", () => {
    // slope 2 for the first 5 points, then flat (slope 0).
    const cps = detectChangepoints([0, 2, 4, 6, 8, 8, 8, 8]);
    expect(cps).toHaveLength(1);
    expect(cps[0].index).toBe(4);
    expect(cps[0].slopeBefore).toBeCloseTo(2, 6);
    // "after" segment is [8,8,8,8] -> flat.
    expect(cps[0].slopeAfter).toBeCloseTo(0, 6);
    expect(cps[0].delta).toBeCloseTo(2, 6);
  });

  it("is deterministic (same input -> same output)", () => {
    const series = [0, 2, 4, 6, 8, 8, 8, 8];
    expect(detectChangepoints(series)).toEqual(detectChangepoints(series));
  });

  it("returns no changepoints for a perfectly linear series", () => {
    const cps = detectChangepoints([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(cps).toHaveLength(0);
  });

  it("returns no changepoints for a constant series", () => {
    expect(detectChangepoints([5, 5, 5, 5, 5, 5, 5, 5])).toHaveLength(0);
  });

  it("returns empty for series too short to split", () => {
    expect(detectChangepoints([1, 2, 3, 4, 5])).toEqual([]); // n=5 < minSegment*2=6
  });

  it("respects an explicit threshold (a tiny bend is ignored at high threshold)", () => {
    // gentle slope change: 1 then 1.5 — delta ~0.5 at the bend.
    const series = [0, 1, 2, 3, 4.5, 6, 7.5, 9];
    const lenient = detectChangepoints(series, { threshold: 0.1 });
    const strict = detectChangepoints(series, { threshold: 5 });
    expect(lenient.length).toBeGreaterThan(0);
    expect(strict).toHaveLength(0);
  });

  it("detects a V-shape (down then up) as a single trough changepoint", () => {
    // slope -2 then slope +2: a sharp reversal at the bottom.
    const series = [8, 6, 4, 2, 0, 2, 4, 6, 8];
    const cps = detectChangepoints(series);
    expect(cps).toHaveLength(1);
    expect(cps[0].index).toBe(4);
    expect(cps[0].slopeBefore).toBeLessThan(0);
    expect(cps[0].slopeAfter).toBeGreaterThan(0);
    expect(cps[0].delta).toBeCloseTo(4, 6);
  });

  it("honours a custom minSegment (wider segments shrink the candidate window)", () => {
    const series = [0, 2, 4, 6, 8, 8, 8, 8];
    // minSegment 4 -> candidates only at t=4; still finds the bend.
    const cps = detectChangepoints(series, { minSegment: 4 });
    expect(cps).toHaveLength(1);
    expect(cps[0].index).toBe(4);
  });
});
