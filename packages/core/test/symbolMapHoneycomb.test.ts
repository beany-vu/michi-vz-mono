import { describe, it, expect } from "vitest";
import {
  cellCenter,
  nearestCell,
  layoutHoneycomb,
  honeycombSpacing,
} from "../src/symbolMap/honeycomb";
import type { ProjectedPoint } from "../src/symbolMap/scales";
import type { SymbolMapNode } from "../src/symbolMap/data";

const cfg = { radius: 10, gap: 0, orientation: "flat" as const };

const pt = (id: string, x: number, y: number, hasValue = true): ProjectedPoint => ({
  node: {
    id,
    label: id,
    lng: 0,
    lat: 0,
    value: hasValue ? 1 : 0,
    valueSecond: null,
    hasValue,
  } as SymbolMapNode,
  x,
  y,
});
const reserves = (p: ProjectedPoint): boolean => p.node.hasValue === true;

describe("honeycomb geometry", () => {
  it("flat spacing is 1.5r by sqrt3 r", () => {
    const s = honeycombSpacing(cfg);
    expect(s.colStep).toBeCloseTo(15);
    expect(s.rowStep).toBeCloseTo(17.3205, 3);
  });

  it("odd columns are shifted by half a row (flat)", () => {
    expect(cellCenter(0, 0, cfg)).toEqual([0, 0]);
    const [x, y] = cellCenter(1, 0, cfg);
    expect(x).toBeCloseTo(15);
    expect(y).toBeCloseTo(8.66, 2);
  });

  it("odd rows are shifted by half a column (pointy)", () => {
    const p = { ...cfg, orientation: "pointy" as const };
    const [x, y] = cellCenter(0, 1, p);
    expect(x).toBeCloseTo(8.66, 2);
    expect(y).toBeCloseTo(15);
  });

  it("gap widens both steps", () => {
    const s = honeycombSpacing({ ...cfg, gap: 2 });
    expect(s.colStep).toBeCloseTo(15 + Math.sqrt(3), 3);
    expect(s.rowStep).toBeCloseTo(17.3205 + 2, 3);
  });

  it("nearestCell inverts cellCenter in both orientations", () => {
    for (const orientation of ["flat", "pointy"] as const) {
      const c = { ...cfg, orientation };
      for (const [col, row] of [
        [0, 0],
        [1, 0],
        [2, 3],
        [3, -1],
        [-2, 1],
      ] as const) {
        const [x, y] = cellCenter(col, row, c);
        expect(nearestCell(x + 1, y - 1, c)).toEqual([col, row]);
      }
    }
  });
});

describe("layoutHoneycomb", () => {
  it("snaps every point to a cell centre and gives every tile the tile radius", () => {
    const { placed, unresolved } = layoutHoneycomb([pt("a", 1, 1), pt("b", 31, 0)], cfg, reserves);
    expect(unresolved).toEqual([]);
    expect(placed.map((p) => [p.x, p.y])).toEqual([
      [0, 0],
      [30, 0],
    ]);
    expect(placed.every((p) => p.radius === 10)).toBe(true);
    expect(placed.map((p) => p.point.node.id)).toEqual(["a", "b"]);
  });

  it("moves the LATER item to the first free neighbour, deterministically", () => {
    const run = () => layoutHoneycomb([pt("a", 0, 0), pt("b", 2, 1)], cfg, reserves);
    const first = run();
    const second = run();
    expect([first.placed[0].x, first.placed[0].y]).toEqual([0, 0]);
    expect([first.placed[1].x, first.placed[1].y]).not.toEqual([0, 0]);
    // the neighbour is one lattice step away
    const d = Math.hypot(first.placed[1].x, first.placed[1].y);
    expect(d).toBeCloseTo(17.3205, 3);
    expect(second.placed).toEqual(first.placed);
  });

  it("no-value items never reserve a cell and may share one", () => {
    const { placed } = layoutHoneycomb([pt("n", 0, 0, false), pt("a", 1, 1)], cfg, reserves);
    expect([placed[0].x, placed[0].y]).toEqual([0, 0]);
    expect([placed[1].x, placed[1].y]).toEqual([0, 0]);
  });

  it("reports ids that found no free cell within maxRing", () => {
    const many = Array.from({ length: 9 }, (_, i) => pt(`p${i}`, 0, 0));
    const { placed, unresolved } = layoutHoneycomb(many, cfg, reserves, 1);
    expect(unresolved).toEqual(["p7", "p8"]); // 1 centre + 6 ring-1 cells hold 7
    expect(placed.length).toBe(9); // overflowing items are still placed (overlapping)
  });

  it("fills ring 2 once ring 1 is full", () => {
    const many = Array.from({ length: 8 }, (_, i) => pt(`p${i}`, 0, 0));
    const { placed, unresolved } = layoutHoneycomb(many, cfg, reserves);
    expect(unresolved).toEqual([]);
    const keys = new Set(placed.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`));
    expect(keys.size).toBe(8);
    const far = Math.hypot(placed[7].x, placed[7].y);
    expect(far).toBeGreaterThan(17.4);
  });

  it("returns an empty layout for no points", () => {
    expect(layoutHoneycomb([], cfg, reserves)).toEqual({ placed: [], unresolved: [] });
  });
});
