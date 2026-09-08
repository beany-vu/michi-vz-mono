// Hexagon mark geometry for SymbolMapChart's `shape: "hexagon"`. The hexagon's
// CIRCUMRADIUS is the mark radius, so everything that reasons about a mark's
// size (force collision, honeycomb tile size, hit-testing, label fitting) keeps
// using `radius` unchanged - only the painted outline differs. Two orientations:
// "flat" (a flat edge on top, first vertex on +x) and "pointy" (a vertex on top,
// first vertex at 30 degrees). The honeycomb lattice (honeycomb.ts) uses the same
// orientation so tiles tessellate.
export type SymbolShape = "circle" | "hexagon";
export type HexOrientation = "flat" | "pointy";

const round3 = (v: number): number => Math.round(v * 1000) / 1000;

/** Six vertices, counter-clockwise from the first vertex, centred on (0, 0). */
export function hexagonVertices(
  r: number,
  orientation: HexOrientation = "flat",
): Array<[number, number]> {
  const start = orientation === "flat" ? 0 : Math.PI / 6;
  const out: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = start + (i * Math.PI) / 3;
    out.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return out;
}

/** SVG path (`M…L…Z`, 3-decimal coordinates) for a hexagon centred on (0, 0). */
export function hexagonPath(r: number, orientation: HexOrientation = "flat"): string {
  const v = hexagonVertices(r, orientation).map(([x, y]) => `${round3(x)},${round3(y)}`);
  return `M${v[0]}L${v.slice(1).join("L")}Z`;
}
