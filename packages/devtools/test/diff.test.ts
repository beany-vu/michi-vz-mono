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

describe("diffObjects keyOf (match array items by identity)", () => {
  const ranked = {
    series: [
      { label: "A", max: 1 },
      { label: "B", max: 2 },
      { label: "C", max: 3 },
    ],
  };
  const reranked = {
    series: [
      { label: "C", max: 3 },
      { label: "A", max: 1 },
      { label: "B", max: 2 },
    ],
  };

  it("is off by default: arrays still compare by position", () => {
    expect(diffObjects(ranked, reranked)).toHaveLength(6);
  });

  it("turns a re-rank into ONE reordered entry instead of a wall of changes", () => {
    expect(diffObjects(ranked, reranked, "", { keyOf: true })).toEqual([
      { path: "series", kind: "reordered", from: ["A", "B", "C"], to: ["C", "A", "B"] },
    ]);
  });

  it("reports a field change under the item's key, not its index", () => {
    const next = {
      series: [
        { label: "A", max: 1 },
        { label: "B", max: 5 },
        { label: "C", max: 3 },
      ],
    };
    expect(diffObjects(ranked, next, "", { keyOf: true })).toEqual([
      { path: 'series["B"].max', kind: "changed", from: 2, to: 5 },
    ]);
  });

  it("reports removed and added items by key", () => {
    const prev = { nodes: [{ id: "x" }, { id: "y" }] };
    const next = { nodes: [{ id: "y" }, { id: "z" }] };
    expect(diffObjects(prev, next, "", { keyOf: true })).toEqual([
      { path: 'nodes["x"]', kind: "removed", from: { id: "x" } },
      { path: 'nodes["z"]', kind: "added", to: { id: "z" } },
    ]);
  });

  it("keys by label, then key, then id, then code", () => {
    const byKey = diffObjects(
      { series: [{ key: "k1", total: 1 }] },
      { series: [{ key: "k1", total: 2 }] },
      "",
      { keyOf: true },
    );
    expect(byKey[0].path).toBe('series["k1"].total');
    const byCode = diffObjects(
      { jets: [{ code: "GE", value: 1 }] },
      { jets: [{ code: "GE", value: 2 }] },
      "",
      { keyOf: true },
    );
    expect(byCode[0].path).toBe('jets["GE"].value');
    const labelWins = diffObjects(
      { rows: [{ label: "L", id: "I", v: 1 }] },
      { rows: [{ label: "L", id: "I", v: 2 }] },
      "",
      { keyOf: true },
    );
    expect(labelWins[0].path).toBe('rows["L"].v');
  });

  it("falls back to positions when an item has no key or a key repeats", () => {
    const noKey = diffObjects({ links: [{ value: 1 }] }, { links: [{ value: 2 }] }, "", {
      keyOf: true,
    });
    expect(noKey).toEqual([{ path: "links[0].value", kind: "changed", from: 1, to: 2 }]);
    const dup = diffObjects(
      {
        xs: [
          { label: "A", v: 1 },
          { label: "A", v: 2 },
        ],
      },
      {
        xs: [
          { label: "A", v: 1 },
          { label: "A", v: 3 },
        ],
      },
      "",
      { keyOf: true },
    );
    expect(dup).toEqual([{ path: "xs[1].v", kind: "changed", from: 2, to: 3 }]);
  });

  it("emits one reordered entry for a primitive array with the same members in a new order", () => {
    expect(
      diffObjects(
        { renderedRankedIds: ["a", "b", "c"] },
        { renderedRankedIds: ["c", "a", "b"] },
        "",
        {
          keyOf: true,
        },
      ),
    ).toEqual([
      { path: "renderedRankedIds", kind: "reordered", from: ["a", "b", "c"], to: ["c", "a", "b"] },
    ]);
  });

  it("keeps positional entries for a primitive array whose members changed", () => {
    expect(diffObjects({ ids: ["a", "b"] }, { ids: ["a", "c"] }, "", { keyOf: true })).toEqual([
      { path: "ids[1]", kind: "changed", from: "b", to: "c" },
    ]);
  });

  it("accepts a custom key function", () => {
    const out = diffObjects(
      { links: [{ source: "a", target: "b", value: 1 }] },
      { links: [{ source: "a", target: "b", value: 4 }] },
      "",
      {
        keyOf: (item) =>
          `${(item as { source: string }).source}→${(item as { target: string }).target}`,
      },
    );
    expect(out).toEqual([{ path: 'links["a→b"].value', kind: "changed", from: 1, to: 4 }]);
  });
});
