import { describe, it, expect } from "vitest";
import {
  linear,
  easeOutQuad,
  easeInOutCubic,
  resolveEasing,
  type EasingFn,
} from "../src/animation/easing";

const fns: Array<[string, EasingFn]> = [
  ["linear", linear],
  ["easeOutQuad", easeOutQuad],
  ["easeInOutCubic", easeInOutCubic],
];

describe("easing functions", () => {
  it.each(fns)("%s maps 0 to 0 and 1 to 1", (_name, fn) => {
    expect(fn(0)).toBeCloseTo(0, 10);
    expect(fn(1)).toBeCloseTo(1, 10);
  });

  it.each(fns)("%s is non-decreasing across [0,1]", (_name, fn) => {
    let prev = fn(0);
    for (let i = 1; i <= 20; i++) {
      const v = fn(i / 20);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it("linear is identity at midpoint", () => {
    expect(linear(0.5)).toBeCloseTo(0.5, 10);
  });

  it("easeOutQuad(0.5) is 0.75", () => {
    expect(easeOutQuad(0.5)).toBeCloseTo(0.75, 10);
  });

  it("easeInOutCubic is symmetric around the midpoint", () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
    expect(easeInOutCubic(0.25) + easeInOutCubic(0.75)).toBeCloseTo(1, 10);
  });
});

describe("resolveEasing", () => {
  it("maps known names to the matching function", () => {
    expect(resolveEasing("linear", easeInOutCubic)).toBe(linear);
    expect(resolveEasing("easeOutQuad", linear)).toBe(easeOutQuad);
    expect(resolveEasing("easeInOutCubic", linear)).toBe(easeInOutCubic);
  });

  it("passes a custom function through untouched", () => {
    const custom: EasingFn = t => t * t;
    expect(resolveEasing(custom, linear)).toBe(custom);
  });

  it("falls back for undefined or unknown names", () => {
    expect(resolveEasing(undefined, easeOutQuad)).toBe(easeOutQuad);
    expect(resolveEasing("nope" as never, easeOutQuad)).toBe(easeOutQuad);
  });
});
