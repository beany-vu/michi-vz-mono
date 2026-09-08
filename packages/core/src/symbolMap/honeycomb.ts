// SymbolMap "honeycomb" placement: every symbol becomes an equal-size tile
// snapped onto a hexagonal lattice, so tiles tessellate and never overlap. Value
// is carried by colour (colorScale), not size. This is the "hex tile map" look
// (one tile per country at its centroid) - NOT a hexbin density map and NOT a
// hand-authored tile cartogram: positions still come from lng/lat.
//
// Lattice ("offset coordinates", Red Blob Games naming):
//  - "flat"   tiles -> odd-q: columns are the primary axis, odd COLUMNS are
//              shifted down by half a row. colStep = 1.5r + gap*sqrt3/2,
//              rowStep = sqrt3*r + gap.
//  - "pointy" tiles -> odd-r: rows are primary, odd ROWS are shifted right by
//              half a column. rowStep = 1.5r + gap*sqrt3/2, colStep = sqrt3*r + gap.
// (the gap projects onto the two axes with the same sqrt3/2 factor the hexagon's
// own geometry has, so a uniform gap stays uniform on screen.)
//
// Collision: items are processed in dataSet order. A tile that RESERVES (the
// engine passes `hasValue`) and lands on an occupied cell walks the hex rings
// around its cell (distance 1, then 2, ... up to `maxRing`) in a fixed direction
// order and takes the first free cell; if none is free it keeps its cell
// (overlap) and is reported in `unresolved` so the engine can emit a
// DataWarning. Non-reserving tiles (no value) are placed but never claim a cell,
// mirroring the legacy behaviour where "no data" tiles are transparent and must
// not push real data around. Pure and deterministic: no randomness, no timers.
import type { ProjectedPoint } from "./scales";
import type { SymbolMapLayoutPoint } from "./layout";
import type { HexOrientation } from "./shape";

export interface HoneycombConfig {
  /** Tile circumradius in px. */
  radius: number;
  /** Gap between tile edges in px. */
  gap: number;
  orientation: HexOrientation;
}

export interface HoneycombResult {
  placed: SymbolMapLayoutPoint[];
  /** Ids of reserving tiles that found no free cell within `maxRing` (they
   * overlap the tile that holds their cell). */
  unresolved: string[];
}

const SQRT3 = Math.sqrt(3);
const DEFAULT_MAX_RING = 6;

export function honeycombSpacing(cfg: HoneycombConfig): { colStep: number; rowStep: number } {
  const r = cfg.radius;
  const g = cfg.gap;
  return cfg.orientation === "flat"
    ? { colStep: 1.5 * r + (g * SQRT3) / 2, rowStep: SQRT3 * r + g }
    : { colStep: SQRT3 * r + g, rowStep: 1.5 * r + (g * SQRT3) / 2 };
}

const isOdd = (n: number): boolean => (n & 1) === 1;
// Math.round(-0.3) is -0; as a Map/Set key that would differ from 0 ("-0,0" vs
// "0,0") and split one cell into two - normalise every rounded index.
const idx = (n: number): number => (n === 0 ? 0 : n);

/** Plot-space centre of lattice cell (col, row). */
export function cellCenter(col: number, row: number, cfg: HoneycombConfig): [number, number] {
  const { colStep, rowStep } = honeycombSpacing(cfg);
  if (cfg.orientation === "flat") {
    return [col * colStep, row * rowStep + (isOdd(col) ? rowStep / 2 : 0)];
  }
  return [col * colStep + (isOdd(row) ? colStep / 2 : 0), row * rowStep];
}

/** Lattice cell whose centre is nearest to (x, y): round the primary axis first,
 * strip that axis' half-step offset, then round the other axis. */
export function nearestCell(x: number, y: number, cfg: HoneycombConfig): [number, number] {
  const { colStep, rowStep } = honeycombSpacing(cfg);
  if (cfg.orientation === "flat") {
    const col = idx(Math.round(x / colStep));
    const row = idx(Math.round((y - (isOdd(col) ? rowStep / 2 : 0)) / rowStep));
    return [col, row];
  }
  const row = idx(Math.round(y / rowStep));
  const col = idx(Math.round((x - (isOdd(row) ? colStep / 2 : 0)) / colStep));
  return [col, row];
}

// ---- cube <-> offset coordinates (for ring walks) ----
type Cube = [number, number, number];

function offsetToCube(col: number, row: number, orientation: HexOrientation): Cube {
  if (orientation === "flat") {
    // odd-q
    const q = col;
    const r = row - (col - (col & 1)) / 2;
    return [q, r, -q - r];
  }
  // odd-r
  const q = col - (row - (row & 1)) / 2;
  const r = row;
  return [q, r, -q - r];
}

function cubeToOffset(c: Cube, orientation: HexOrientation): [number, number] {
  const [q, r] = c;
  if (orientation === "flat") return [q, r + (q - (q & 1)) / 2];
  return [q + (r - (r & 1)) / 2, r];
}

const DIRS: Cube[] = [
  [1, -1, 0],
  [1, 0, -1],
  [0, 1, -1],
  [-1, 1, 0],
  [-1, 0, 1],
  [0, -1, 1],
];

const add = (a: Cube, b: Cube, k = 1): Cube => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

/** The 6k cells at cube distance k, in a fixed walk order (deterministic). */
function cubeRing(center: Cube, k: number): Cube[] {
  const out: Cube[] = [];
  let cur = add(center, DIRS[4], k);
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < k; j++) {
      out.push(cur);
      cur = add(cur, DIRS[i]);
    }
  }
  return out;
}

const key = (col: number, row: number): string => `${col},${row}`;

export function layoutHoneycomb(
  points: ProjectedPoint[],
  cfg: HoneycombConfig,
  reserves: (point: ProjectedPoint) => boolean,
  maxRing: number = DEFAULT_MAX_RING,
): HoneycombResult {
  const placed: SymbolMapLayoutPoint[] = [];
  const unresolved: string[] = [];
  const occupied = new Set<string>();

  for (const point of points) {
    let [col, row] = nearestCell(point.x, point.y, cfg);
    if (reserves(point)) {
      if (occupied.has(key(col, row))) {
        let found = false;
        const center = offsetToCube(col, row, cfg.orientation);
        for (let k = 1; k <= maxRing && !found; k++) {
          for (const c of cubeRing(center, k)) {
            const [cc, rr] = cubeToOffset(c, cfg.orientation);
            if (!occupied.has(key(cc, rr))) {
              col = cc;
              row = rr;
              found = true;
              break;
            }
          }
        }
        if (!found) unresolved.push(point.node.id);
      }
      occupied.add(key(col, row));
    }
    const [x, y] = cellCenter(col, row, cfg);
    placed.push({ point, radius: cfg.radius, x, y });
  }

  return { placed, unresolved };
}
