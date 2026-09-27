// Reading a drawn fountain back the way a reader sees it, for the tests: the bell
// outline's polygon (bellOutline's points, or an svg path's) and how far a small dot's
// disc goes past it. Shared by the packing and the example tests.
//
// The overflow of a disc is measured, not derived: points round its circle (and where it
// crosses the tip's and the base's lines), each outside the outline counted by its
// distance to the outline's sides. The parts above the tip's line and below the base's
// line do not count: a dot at `high` pokes above the tip, and one at `low` hangs half below
// the base, by construction.
import { FOUNTAIN_DOT_RADIUS } from "../src/fountainChart/geometry";

export type Pt = [number, number];

/** A big dot: centre and radius (its ring reaches 1 px further). */
export interface BigDot {
  x: number;
  y: number;
  r: number;
}

const R = FOUNTAIN_DOT_RADIUS;
/** How far a disc may reach past the outline's centre line: half its 1.2 px stroke. */
export const ALLOWANCE = 0.6;
/** Where no spot in a row is within the allowance, how much further out than the best
 * spot in that row a dot may be. */
export const BEST_SLACK = 0.05;
// The rooms the checks below look in are a hair within the allowance, so a spot found
// there is one the packer had.
const ROOM = 0.55;

function segDist(px: number, py: number, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = dx * dx + dy * dy;
  const t = L ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / L)) : 0;
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

/** x on a chain of points (y monotone either way) at height y, clamped to its ends. */
function chainX(chain: Pt[], y: number): number {
  const n = chain.length;
  if (n === 1) return chain[0][0];
  const down = chain[n - 1][1] < chain[0][1];
  const before = (i: number): boolean => (down ? chain[i][1] >= y : chain[i][1] <= y);
  if (!before(0)) return chain[0][0];
  if (before(n - 1)) return chain[n - 1][0];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (before(mid)) lo = mid;
    else hi = mid;
  }
  const [a, b] = [chain[lo], chain[hi]];
  return a[1] === b[1] ? a[0] : a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
}

const N = 360;
const COS: number[] = [];
const SIN: number[] = [];
for (let k = 0; k < N; k++) {
  COS.push(Math.cos((2 * Math.PI * k) / N));
  SIN.push(Math.sin((2 * Math.PI * k) / N));
}

/** A drawn outline, read once: its extent, its two sides and the rows asked about. */
class Outline {
  readonly top: number;
  readonly bottom: number;
  private readonly left: Pt[];
  private readonly right: Pt[];
  // The sides: every edge but the closing flat base (last point -> first point).
  private readonly segs: Array<[Pt, Pt]> = [];
  readonly rows = new Map<number, Row>();

  constructor(readonly pts: Pt[]) {
    const ys = pts.map((p) => p[1]);
    this.top = Math.min(...ys);
    this.bottom = Math.max(...ys);
    const tip = ys.indexOf(this.top);
    this.left = pts.slice(0, tip + 1);
    this.right = pts.slice(tip).reverse();
    for (let i = 0; i + 1 < pts.length; i++) this.segs.push([pts[i], pts[i + 1]]);
  }

  /** The outline's x span at height y (clamped to the outline's extent). */
  span(y: number): [number, number] {
    const yy = Math.min(this.bottom, Math.max(this.top, y));
    const a = chainX(this.left, yy);
    const b = chainX(this.right, yy);
    return [Math.min(a, b), Math.max(a, b)];
  }

  private inside(x: number, y: number): boolean {
    if (y < this.top || y > this.bottom) return false;
    const [a, b] = this.span(y);
    return x >= a && x <= b;
  }

  private near(y: number, reach: number): Array<[Pt, Pt]> {
    return this.segs.filter(
      ([a, b]) => Math.max(a[1], b[1]) >= y - reach && Math.min(a[1], b[1]) <= y + reach,
    );
  }

  /** An upper bound on over(x, y): r less the centre's distance to the sides (Infinity
   * when the centre is outside), since a disc of that distance round the centre is
   * inside. */
  bound(x: number, y: number, r = R): number {
    if (!this.inside(x, y)) return Infinity;
    let d = Infinity;
    for (const [a, b] of this.near(y, r + 1)) d = Math.min(d, segDist(x, y, a, b));
    return r - d;
  }

  /** How far a disc of radius r centred at (x, y) goes past the outline's sides (px). */
  over(x: number, y: number, r = R): number {
    const segs = this.near(y, r + 1);
    if (this.inside(x, y)) {
      let d = Infinity;
      for (const [a, b] of segs) d = Math.min(d, segDist(x, y, a, b));
      if (d >= r) return 0;
    }
    let over = 0;
    const at = (px: number, py: number): void => {
      if (py < this.top - 1e-9 || py > this.bottom || this.inside(px, py)) return;
      let m = Infinity;
      for (const [a, b] of segs) m = Math.min(m, segDist(px, py, a, b));
      over = Math.max(over, m);
    };
    for (let k = 0; k < N; k++) {
      const py = y + r * SIN[k];
      if (py < this.bottom - 1e-6) at(x + r * COS[k], py);
    }
    // Where the circle crosses the tip's line and the base's line.
    for (const ly of [this.top, this.bottom - 1e-6]) {
      const dy = ly - y;
      if (Math.abs(dy) < r) {
        const a = Math.sqrt(r * r - dy * dy);
        at(x - a, ly);
        at(x + a, ly);
      }
    }
    return over;
  }
}

const outlines = new WeakMap<Pt[], Outline>();
function outlineOf(pts: Pt[]): Outline {
  let o = outlines.get(pts);
  if (!o) outlines.set(pts, (o = new Outline(pts)));
  return o;
}

/** One row of a drawn fountain: where a small dot centred on it may go. */
export class Row {
  private _best?: [number, number];
  private _room?: [number, number] | null;

  constructor(
    private readonly o: Outline,
    readonly y: number,
  ) {}

  /** How far a dot's disc centred at x on this row goes past the outline (px). */
  over(x: number): number {
    return this.o.over(x, this.y);
  }

  /** The least overflow any spot in this row gives: a scan of the row. */
  get best(): number {
    return this.bestAt()[0];
  }

  /** Where the row's least overflow is. */
  get bestX(): number {
    return this.bestAt()[1];
  }

  private bestAt(): [number, number] {
    if (this._best) return this._best;
    const [a, b] = this.o.span(this.y);
    const mid = (a + b) / 2;
    if (this.over(mid) === 0) return (this._best = [0, mid]);
    let best: [number, number] = [Infinity, mid];
    for (let x = a - R; x <= b + R + 1e-9; x += 0.25) {
      const v = this.over(x);
      if (v < best[0]) best = [v, x];
    }
    // Then finer round it (the overflow falls to one least value across a row).
    let [lo, hi] = [best[1] - 0.25, best[1] + 0.25];
    for (let k = 0; k < 40; k++) {
      const m1 = lo + (hi - lo) / 3;
      const m2 = hi - (hi - lo) / 3;
      if (this.over(m1) <= this.over(m2)) hi = m2;
      else lo = m1;
    }
    const x = (lo + hi) / 2;
    const v = this.over(x);
    return (this._best = v < best[0] ? [v, x] : best);
  }

  /** Where a dot's disc stays within the allowance in this row (a hair within it), as
   * [lo, hi], or null where no spot does. */
  get room(): [number, number] | null {
    if (this._room !== undefined) return this._room;
    if (this.best > ROOM) return (this._room = null);
    const from = this.bestX;
    const edge = (dir: number): number => {
      let inX = from;
      let outX = from + dir * 0.5;
      while (this.over(outX) <= ROOM) [inX, outX] = [outX, outX + dir * 0.5];
      for (let k = 0; k < 30; k++) {
        const m = (inX + outX) / 2;
        if (this.over(m) <= ROOM) inX = m;
        else outX = m;
      }
      return inX;
    };
    return (this._room = [edge(-1), edge(1)]);
  }
}

export function rowAt(pts: Pt[], y: number): Row {
  const o = outlineOf(pts);
  let row = o.rows.get(y);
  if (!row) o.rows.set(y, (row = new Row(o, y)));
  return row;
}

/** How far a dot's disc (radius R) centred at (x, y) goes past the outline (px). */
export function overflowAt(pts: Pt[], x: number, y: number): number {
  return outlineOf(pts).over(x, y);
}

/**
 * Why a dot is not inside its fountain, or null. Its disc may go at most the allowance
 * (half the outline's stroke) past the outline, or, in a row where no spot is within the
 * allowance (near the tip), at most BEST_SLACK further out than the best spot in that row.
 */
export function outsideBy(pts: Pt[], d: { x: number; y: number }): string | null {
  if (outlineOf(pts).bound(d.x, d.y) <= ALLOWANCE) return null;
  const row = rowAt(pts, d.y);
  const over = row.over(d.x);
  if (over <= ALLOWANCE || over <= row.best + BEST_SLACK) return null;
  return `disc ${over.toFixed(2)} px out (the best spot in its row: ${row.best.toFixed(2)} px, ${(row.bestX - d.x).toFixed(2)} px away)`;
}

/**
 * The parts of a row's room where a dot shows more than `shows` px past the big dot's
 * ring (the big dot covers |x - big.x| <= c at this height).
 */
export function visibleParts(row: Row, big: BigDot, y: number, shows: number): Pt[] {
  if (!row.room) return [];
  const [lo, hi] = row.room;
  const reach = big.r + 1 - R + shows;
  const dy = y - big.y;
  const c = reach > Math.abs(dy) ? Math.sqrt(reach * reach - dy * dy) : 0;
  const parts: Pt[] = [];
  if (Math.min(hi, big.x - c) > lo) parts.push([lo, Math.min(hi, big.x - c)]);
  if (Math.max(lo, big.x + c) < hi) parts.push([Math.max(lo, big.x + c), hi]);
  return parts;
}

/**
 * How many dots 0.5 px apart the row's room holds where each still shows clearly past
 * the big dot (more than 0.5 px). Where it holds fewer than the row's dots, some share
 * a point rather than hide under the big dot.
 */
export function capacity(row: Row, big: BigDot, y: number): number {
  return visibleParts(row, big, y, 0.55).reduce(
    (n, [a, b]) => n + Math.floor((b - a) / 0.55) + 1,
    0,
  );
}

/** How far the big dot's ring reaches past a small dot (>= 0: the small dot is fully
 * covered). */
export const hiddenBy = (big: BigDot, d: { x: number; y: number; r?: number }): number =>
  big.r + 1 - (Math.hypot(d.x - big.x, d.y - big.y) + (d.r ?? R));

/**
 * Every check on one fountain's small dots: each disc inside (outsideBy); none fully
 * under the big dot wherever its row has a spot within the allowance that the big dot
 * leaves showing; no two within 0.5 px wherever their row's room holds them apart.
 */
export function checkDots<D extends { x: number; y: number; r?: number; value: number | string }>(
  pts: Pt[],
  big: BigDot,
  dots: ReadonlyArray<D>,
  tag: (d: D) => string = (d) => `${d.value} (${d.x.toFixed(2)},${d.y.toFixed(2)})`,
): { outside: string[]; hidden: string[]; together: string[] } {
  const outside: string[] = [];
  const hidden: string[] = [];
  const together: string[] = [];
  for (const d of dots) {
    const why = outsideBy(pts, d);
    if (why) outside.push(`${tag(d)}: ${why}`);
    if (hiddenBy(big, d) >= 0 && visibleParts(rowAt(pts, d.y), big, d.y, 0.05).length) {
      hidden.push(tag(d));
    }
  }
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const [a, b] = [dots[i], dots[j]];
      if (Math.hypot(a.x - b.x, a.y - b.y) >= 0.5) continue;
      const inRow = dots.filter((c) => Math.abs(c.y - a.y) < 0.5).length;
      if (inRow <= capacity(rowAt(pts, a.y), big, a.y)) together.push(`${tag(a)} ~ ${tag(b)}`);
    }
  }
  return { outside, hidden, together };
}
