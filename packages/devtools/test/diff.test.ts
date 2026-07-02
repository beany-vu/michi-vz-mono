import { describe, it, expect } from "vitest";
import { diffObjects } from "../src/diff";

describe("diffObjects", () => {
  it("returns an empty list for identical values", () => {
    expect(diffObjects({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toEqual([]);
  });

  it("reports changed primitives with their path and both values", () => {
    const out = diffObjects({ a: 1 }, { a: 2 });
    expect(out).toEqual([{ path: "a", kind: "changed", from: 1, to: 2 }]);
  });

  it("walks nested objects and arrays", () => {
    const prev = { stats: { count: 3 }, series: [{ label: "A", max: 140 }] };
    const next = { stats: { count: 2 }, series: [{ label: "A", max: 555 }] };
    const out = diffObjects(prev, next);
    expect(out).toContainEqual({ path: "stats.count", kind: "changed", from: 3, to: 2 });
    expect(out).toContainEqual({ path: "series[0].max", kind: "changed", from: 140, to: 555 });
  });

  it("reports added and removed keys", () => {
    const out = diffObjects({ a: 1 }, { b: 2 });
    expect(out).toContainEqual({ path: "a", kind: "removed", from: 1 });
    expect(out).toContainEqual({ path: "b", kind: "added", to: 2 });
  });

  it("reports array growth and shrinkage per index", () => {
    const grew = diffObjects({ xs: [1] }, { xs: [1, 2] });
    expect(grew).toContainEqual({ path: "xs[1]", kind: "added", to: 2 });
    const shrank = diffObjects({ xs: [1, 2] }, { xs: [1] });
    expect(shrank).toContainEqual({ path: "xs[1]", kind: "removed", from: 2 });
  });

  it("treats a type change as a single changed entry, not a deep walk", () => {
    const out = diffObjects({ a: { x: 1 } }, { a: [1] });
    expect(out).toEqual([{ path: "a", kind: "changed", from: { x: 1 }, to: [1] }]);
  });
});
