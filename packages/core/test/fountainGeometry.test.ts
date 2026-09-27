import { describe, it, expect } from "vitest";
import {
  bellHalfWidth,
  bellDrift,
  bellOutline,
  bellAt,
  fountainHalfWidth,
  fountainStemWidth,
  fountainBigDotRadius,
  FOUNTAIN_BIG_DOT_RADIUS,
  FOUNTAIN_STEM_WIDTH,
} from "../src/fountainChart/geometry";

describe("bellHalfWidth: half * (1 - t^2.2)^0.55", () => {
  it("is the full half-width at t = 0 (low, the base) and 0 at t = 1 (high, the tip)", () => {
    expect(bellHalfWidth(0, 20)).toBe(20);
    expect(bellHalfWidth(1, 20)).toBe(0);
  });

  it("matches the mock formula in between", () => {
    for (const t of [0.1, 0.35, 0.5, 0.8, 0.99]) {
      expect(bellHalfWidth(t, 18)).toBeCloseTo(18 * Math.pow(1 - Math.pow(t, 2.2), 0.55), 10);
    }
  });

  it("never grows on the way up (monotonic non-increasing)", () => {
    let prev = Infinity;
    for (let i = 0; i <= 200; i++) {
      const w = bellHalfWidth(i / 200, 24);
      expect(w).toBeLessThanOrEqual(prev + 1e-12);
      prev = w;
    }
  });

  it("clamps t outside [0, 1] instead of returning NaN", () => {
    expect(bellHalfWidth(-0.5, 10)).toBe(10);
    expect(bellHalfWidth(1.5, 10)).toBe(0);
  });
});

describe("bellDrift: the Geneva look", () => {
  it("is 0 everywhere when drift is off", () => {
    expect(bellDrift(0.7, 20, false)).toBe(0);
    expect(bellDrift(1, 20, false)).toBe(0);
  });

  it("shifts each row by half * 0.55 * t^1.5 when on: 0 at the base, most at the tip", () => {
    expect(bellDrift(0, 20, true)).toBe(0);
    expect(bellDrift(1, 20, true)).toBeCloseTo(11, 10);
    expect(bellDrift(0.5, 20, true)).toBeCloseTo(20 * 0.55 * Math.pow(0.5, 1.5), 10);
  });
});

describe("fountainHalfWidth: max(12, 6 + 3.2 sqrt(n)), capped at min(24, 0.32 slot)", () => {
  it("never narrower than 12 px on a wide slot", () => {
    expect(fountainHalfWidth(0, 200)).toBe(12);
    expect(fountainHalfWidth(4, 200)).toBe(12.4);
  });

  it("grows with the square root of the sample count", () => {
    expect(fountainHalfWidth(20, 200)).toBeCloseTo(6 + 3.2 * Math.sqrt(20), 10);
  });

  it("caps at 24 px, and at 32% of the slot on narrow slots", () => {
    expect(fountainHalfWidth(400, 500)).toBe(24);
    expect(fountainHalfWidth(20, 40)).toBeCloseTo(12.8, 10);
    expect(fountainHalfWidth(0, 20)).toBeCloseTo(6.4, 10);
  });
});

describe("stem and big dot sizing", () => {
  it("full size on normal slots, scaled down on very narrow ones", () => {
    expect(fountainStemWidth(100)).toBe(FOUNTAIN_STEM_WIDTH);
    expect(fountainBigDotRadius(100)).toBe(FOUNTAIN_BIG_DOT_RADIUS);
    expect(fountainStemWidth(20)).toBeLessThan(FOUNTAIN_STEM_WIDTH);
    expect(fountainBigDotRadius(20)).toBeLessThan(FOUNTAIN_BIG_DOT_RADIUS);
    expect(fountainStemWidth(1)).toBeGreaterThan(0);
    expect(fountainBigDotRadius(1)).toBeGreaterThan(0);
  });
});

describe("bellOutline", () => {
  const bell = { cx: 100, yTop: 40, yBottom: 240, half: 20, drift: false };

  it("spans exactly [yTop, yBottom]: flat base at low, a point at high", () => {
    const pts = bellOutline(bell);
    const ys = pts.map((p) => p[1]);
    expect(Math.min(...ys)).toBe(40);
    expect(Math.max(...ys)).toBe(240);
    const base = pts.filter((p) => p[1] === 240).map((p) => p[0]);
    expect(base.sort((a, b) => a - b)).toEqual([80, 120]);
    const tip = pts.filter((p) => p[1] === 40);
    expect(tip).toEqual([[100, 40]]);
  });

  it("is symmetric about the centre without drift", () => {
    const pts = bellOutline(bell, 10);
    expect(pts).toHaveLength(21);
    for (let i = 0; i < 10; i++) {
      const l = pts[i];
      const r = pts[pts.length - 1 - i];
      expect(l[1]).toBeCloseTo(r[1], 10);
      expect(100 - l[0]).toBeCloseTo(r[0] - 100, 10);
    }
  });

  it("leans the tip right with drift, keeping the base in place", () => {
    const pts = bellOutline({ ...bell, drift: true });
    const tip = pts.find((p) => p[1] === 40)!;
    expect(tip[0]).toBeCloseTo(111, 10);
    const base = pts.filter((p) => p[1] === 240).map((p) => p[0]);
    expect(base.sort((a, b) => a - b)).toEqual([80, 120]);
  });

  it("bellAt gives the centre and half-width at a pixel y", () => {
    expect(bellAt(bell, 240)).toEqual({ centre: 100, halfWidth: 20 });
    expect(bellAt(bell, 40).halfWidth).toBe(0);
    const mid = bellAt({ ...bell, drift: true }, 140);
    expect(mid.halfWidth).toBeCloseTo(bellHalfWidth(0.5, 20), 10);
    expect(mid.centre).toBeCloseTo(100 + bellDrift(0.5, 20, true), 10);
  });
});
