// Pure fountain geometry, ported from the approved mock renderer
// (ai-docs plans/2026-09-26-fountain-mock-renderer.js). All numbers are PIXELS.
// Renderer-agnostic: point arrays, never path strings (each renderer formats).
//
// The fountain is a BELL of falling water: its vertical extent is exactly
// [y(high), y(low)], a point at the top (high) that flares to a flat base (low).
// Width never encodes data; the half-width only grows with the number of small
// dots so they have room. The optional drift (the Geneva wind) leans every row
// downwind by the same rule for every jet.
//
// Small dots are packed deterministically (a beeswarm): each sits at the exact y
// of its sample and dodges sideways inside the bell's width at that height. Two
// things are in the way: the stem (a clear centre lane beside it, from the baseline
// to the big dot, in either direction) and the big dot itself, drawn on top of the
// small dots, so no dot sits under it. Elsewhere the centre is free, so the highest
// sample sits on the tip. A crowd that does not fit overlaps a little rather than
// leave the bell: every dot's disc stays within half the outline's stroke of the drawn
// outline, and just under the tip, where no dot's disc can, as close as its row allows.

/** Small dot radius (px). */
export const FOUNTAIN_DOT_RADIUS = 2.9;
/** Centre distance at which two small dots just stop touching (2r + 0.9 px). */
export const FOUNTAIN_DOT_SPACING = FOUNTAIN_DOT_RADIUS * 2 + 0.9;
/** Sideways offset of the first dots beside the stem (the clear lane's half-width). */
export const FOUNTAIN_LANE_OFFSET = FOUNTAIN_DOT_SPACING * 0.62;
/** How far past the big dot (px), away from the baseline, the stem's lane still reaches. */
export const FOUNTAIN_LANE_REACH = 8;
/** Big dot radius on a normal slot (px). */
export const FOUNTAIN_BIG_DOT_RADIUS = 6.5;
/** Stem width on a normal slot (px). */
export const FOUNTAIN_STEM_WIDTH = 5.2;
/** Rows sampled up each side of the bell outline. */
export const FOUNTAIN_BELL_STEPS = 28;

// Dots keep this much clear space inside the outline while their row has room there.
const EDGE_GAP = 1.5;
// Half the outline's 1.2 px stroke: a dot's disc reaching no further past the outline's
// centre line than this is inside the drawn fountain.
const HALF_STROKE = 0.6;
// How far a dot's disc may go past the outline's centre line (px): HALF_STROKE, less a
// hair for the drawn outline's rounding.
const ALLOWANCE = 0.57;
// Where no spot in a row keeps within ALLOWANCE (just under the tip), how much further
// out than the row's best spot a dot may go (px), unless the best is within HALF_STROKE.
const TIP_SLACK = 0.02;
// Steps of the search for a row's best spot when none keeps within ALLOWANCE.
const BEST_STEPS = 14;
// The big dot's 2 px surface ring reaches this far past its radius.
const BIG_DOT_RING = 1;
// In a crowded row a small dot showing less than this much of itself (px) past the big
// dot's ring is barely seen: only a row with no better spot inside the bell puts it there.
const MIN_VISIBLE = 0.5;
// Two small dots closer than 0.5 px read as one (a hair more here, so rounding never
// leaves two just under it).
const STACK_GAP = 0.52;
// What a crowded row weighs, worst first, each far above everything after it: a dot
// wholly under the big dot, one barely showing past it, one on another small dot. Below
// those, px of overlap (with the other dots, the big dot and the stem's lane).
const HIDDEN = 1e9;
const BARELY = 1e7;
const STACKED = 1e5;
// Positions tried across a crowded row when no candidate is clear (a coarse pass),
// then this many either side of the best one at a finer pitch.
const CROWD_STEPS = 12;
const CROWD_REFINE = 3;
// When all of those sit on another dot: the middles of this many of the widest gaps
// the row's dots leave.
const GAP_TRIES = 4;

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/**
 * Half-width of the bell at relative height t (0 = the base at `low`, 1 = the tip
 * at `high`): half * (1 - t^2.2)^0.55. Full width at t = 0, a point at t = 1,
 * non-increasing in between. t outside [0, 1] is clamped.
 */
export function bellHalfWidth(t: number, half: number): number {
  const tt = clamp01(t);
  return half * Math.pow(Math.max(0, 1 - Math.pow(tt, 2.2)), 0.55);
}

/**
 * The Geneva drift: how far right the bell's centre sits at relative height t,
 * half * 0.55 * t^1.5 (0 at the base, most at the tip). 0 when drift is off.
 */
export function bellDrift(t: number, half: number, drift: boolean): number {
  return drift ? half * 0.55 * Math.pow(clamp01(t), 1.5) : 0;
}

/**
 * Half-width of a fountain in px: max(12, 6 + 3.2 * sqrt(n)) for n small dots, so a
 * bell holding more dots is a little wider, capped at min(24, 32% of the slot) so
 * neighbours never touch.
 */
export function fountainHalfWidth(sampleCount: number, slotWidth: number): number {
  const n = Math.max(0, sampleCount);
  const cap = Math.min(24, 0.32 * Math.max(0, slotWidth));
  return Math.min(cap, Math.max(12, 6 + 3.2 * Math.sqrt(n)));
}

/** Stem width in px: ~5 px, scaled down on very narrow slots (never below 1.5). */
export function fountainStemWidth(slotWidth: number): number {
  return Math.min(FOUNTAIN_STEM_WIDTH, Math.max(1.5, 0.08 * slotWidth));
}

/** Big dot radius in px: 6.5, scaled down on very narrow slots (never below 2.5). */
export function fountainBigDotRadius(slotWidth: number): number {
  return Math.min(FOUNTAIN_BIG_DOT_RADIUS, Math.max(2.5, 0.16 * slotWidth));
}

/** One bell in pixel space. */
export interface FountainBell {
  /** x of the stem / the bell's base centre */
  cx: number;
  /** y of the tip (high) */
  yTop: number;
  /** y of the flat base (low) */
  yBottom: number;
  /** half-width at the base (see fountainHalfWidth) */
  half: number;
  /** lean the top downwind (the same for every jet) */
  drift: boolean;
}

/** Relative height of pixel row y in the bell (0 at the base, 1 at the tip). */
function relHeight(b: FountainBell, y: number): number {
  const span = Math.max(1, b.yBottom - b.yTop);
  return (b.yBottom - y) / span;
}

/** The bell's centre x and half-width at pixel row y. */
export function bellAt(b: FountainBell, y: number): { centre: number; halfWidth: number } {
  const t = clamp01(relHeight(b, y));
  return { centre: b.cx + bellDrift(t, b.half, b.drift), halfWidth: bellHalfWidth(t, b.half) };
}

/**
 * The outline's vertex rows, base (t = 0) to tip (t = 1): the y of each row, the bell's
 * centre there as an offset from cx (the drift) and its half-width. bellOutline draws
 * exactly these; the packer fits the dots between them.
 */
function outlineRows(
  b: FountainBell,
  steps: number,
): { n: number; ys: number[]; centres: number[]; halves: number[] } {
  const n = Math.max(2, Math.round(steps));
  const ys: number[] = [];
  const centres: number[] = [];
  const halves: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    ys.push(i === n ? b.yTop : b.yBottom - t * (b.yBottom - b.yTop));
    centres.push(bellDrift(t, b.half, b.drift));
    halves.push(bellHalfWidth(t, b.half));
  }
  return { n, ys, centres, halves };
}

/**
 * The closed bell outline as [x, y] points: up the left side from the base (t = 0)
 * to the tip (t = 1), then down the right side back to the base. The tip appears
 * once, so there are 2 * steps + 1 points; the polygon closes implicitly.
 */
export function bellOutline(b: FountainBell, steps = FOUNTAIN_BELL_STEPS): Array<[number, number]> {
  const { n, ys, centres, halves } = outlineRows(b, steps);
  const left: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const c = b.cx + centres[i];
    left.push([c - halves[i], ys[i]]);
    if (i < n) right.push([c + halves[i], ys[i]]);
  }
  return [...left, ...right.reverse()];
}

/**
 * The drawn outline (bellOutline's polygon) as the packer reads it, in offsets from cx:
 * its centre and half-width at a pixel row, and where a disc fits between its sides.
 */
class OutlineFit {
  private readonly n: number;
  private readonly ys: number[];
  private readonly lefts: number[];
  private readonly rights: number[];
  private readonly centres: number[];
  private readonly halves: number[];
  private readonly span: number;
  // Per side (0 = left, 1 = right): each piece's outward unit normal (piece i runs from
  // row i up to row i + 1), and at each row below the tip the mitre that moves the
  // corner there onto both of its pieces' pushed-out lines.
  private readonly normals: [Array<[number, number]>, Array<[number, number]>] = [[], []];
  private readonly mitres: [Array<[number, number]>, Array<[number, number]>] = [[], []];
  // The furthest a corner moves up or down per px of push.
  private readonly mitreReach: number;

  constructor(private readonly b: FountainBell) {
    const { n, ys, centres, halves } = outlineRows(b, FOUNTAIN_BELL_STEPS);
    this.n = n;
    this.ys = ys;
    this.centres = centres;
    this.halves = halves;
    this.lefts = centres.map((c, i) => c - halves[i]);
    this.rights = centres.map((c, i) => c + halves[i]);
    this.span = b.yBottom - b.yTop;
    let reach = 0;
    for (const side of [0, 1] as const) {
      const xs = side ? this.rights : this.lefts;
      const nrm = this.normals[side];
      for (let i = 0; i < n; i++) {
        const dx = xs[i + 1] - xs[i];
        const dy = ys[i + 1] - ys[i];
        const len = Math.hypot(dx, dy) || 1;
        nrm.push(side ? [-dy / len, dx / len] : [dy / len, -dx / len]);
      }
      const mit = this.mitres[side];
      mit.push(nrm[0]);
      for (let i = 1; i < n; i++) {
        const [a, c] = [nrm[i - 1], nrm[i]];
        const k = 1 + a[0] * c[0] + a[1] * c[1];
        mit.push(k > 1e-9 ? [(a[0] + c[0]) / k, (a[1] + c[1]) / k] : c);
      }
      for (const m of mit) reach = Math.max(reach, Math.abs(m[1]));
    }
    this.mitreReach = reach;
  }

  /** The outline's centre (offset from cx) and half-width at pixel row y. */
  rowAt(y: number): { centre: number; half: number } {
    // A range with no height draws no outline: its one row is the base.
    if (!(this.span > 1e-9)) return { centre: this.centres[0], half: this.halves[0] };
    const u = Math.min(this.n, Math.max(0, ((this.b.yBottom - y) / this.span) * this.n));
    const i = Math.min(this.n - 1, Math.floor(u));
    const f = u - i;
    return {
      centre: this.centres[i] + f * (this.centres[i + 1] - this.centres[i]),
      half: this.halves[i] + f * (this.halves[i + 1] - this.halves[i]),
    };
  }

  /**
   * The offsets from cx where a disc of radius rho centred on row y lies wholly between
   * the outline's two sides, as [lo, hi], or null where none does. The parts of the disc
   * above the tip or below the base are not held to the sides (a dot keeps its exact y,
   * so one at `low` always hangs half below the base). Exact for the polygon: on each of
   * its straight pieces the tightest point is solved for, not sampled.
   */
  fit(y: number, rho: number): [number, number] | null {
    const { n, ys } = this;
    // A disc reaching above the tip crosses the tip's row, where the outline is a point.
    if (!(this.span > 1e-9) || rho <= 0 || y - rho < this.b.yTop) return null;
    const yA = Math.max(this.b.yTop, y - rho);
    const yB = Math.min(this.b.yBottom, y + rho);
    if (yA > yB) return null;
    const first = Math.min(n - 1, Math.max(0, Math.floor(this.uOf(yB))));
    const last = Math.min(n - 1, Math.max(0, Math.ceil(this.uOf(yA)) - 1));
    let lo = -Infinity;
    let hi = Infinity;
    for (let i = first; i <= last; i++) {
      // Piece i runs from row i (lower) up to row i + 1.
      const y0 = Math.max(ys[i + 1], yA);
      const y1 = Math.min(ys[i], yB);
      if (y0 > y1) continue;
      hi = Math.min(
        hi,
        tightest(ys[i], this.rights[i], ys[i + 1], this.rights[i + 1], y, rho, y0, y1),
      );
      lo = Math.max(
        lo,
        -tightest(ys[i], -this.lefts[i], ys[i + 1], -this.lefts[i + 1], y, rho, y0, y1),
      );
    }
    return lo <= hi ? [lo, hi] : null;
  }

  /**
   * The offsets from cx where a small dot's disc (radius R) centred on row y goes at
   * most s px past the outline, as [lo, hi], or null where it goes further wherever it
   * sits. As in fit, only its parts between the tip's and the base's lines are held to
   * the sides. Solved exactly for the outline pushed s px out along each piece's normal
   * (the pieces meeting at mitred corners), which is the drawn outline plus s px round
   * it except for a sliver beyond a few corners (a few hundredths of a px at most).
   */
  within(y: number, s: number): [number, number] | null {
    const { n } = this;
    // Not pushed out, the outline is a point in the tip's row, which a disc reaching
    // above the tip crosses.
    if (!(this.span > 1e-9) || (s <= 0 && y - FOUNTAIN_DOT_RADIUS < this.b.yTop)) return null;
    const yA = Math.max(this.b.yTop, y - FOUNTAIN_DOT_RADIUS);
    const yB = Math.min(this.b.yBottom, y + FOUNTAIN_DOT_RADIUS);
    if (yA > yB) return null;
    // The pushed-out corners move up or down, so a few more pieces may reach this row.
    const reach = Math.abs(s) * this.mitreReach + 1e-9;
    const first = Math.min(n - 1, Math.max(0, Math.floor(this.uOf(yB + reach))));
    const last = Math.min(n - 1, Math.max(0, Math.ceil(this.uOf(yA - reach)) - 1));
    let lo = -Infinity;
    let hi = Infinity;
    for (let i = first; i <= last; i++) {
      hi = Math.min(hi, this.pushed(1, i, y, s, yA, yB));
      lo = Math.max(lo, -this.pushed(0, i, y, s, yA, yB));
    }
    return lo <= hi ? [lo, hi] : null;
  }

  /** Row y's position in outline pieces (0 at the base, n at the tip). */
  private uOf(py: number): number {
    return ((this.b.yBottom - py) / this.span) * this.n;
  }

  /**
   * The furthest a disc of radius R centred on row y may sit toward one side (the right
   * as an offset, the left as a negated one) against that side's piece i pushed s px
   * out. The piece holds the part of the disc between its two pushed corners' rows; the
   * lowest piece reaches down past the base and the highest up past the tip.
   */
  private pushed(side: 0 | 1, i: number, y: number, s: number, yA: number, yB: number): number {
    const { n, ys } = this;
    const xs = side ? this.rights : this.lefts;
    const sign = side ? 1 : -1;
    const [nx, ny] = this.normals[side][i];
    const lower = i === 0 ? Infinity : ys[i] + s * this.mitres[side][i][1];
    const upper = i === n - 1 ? -Infinity : ys[i + 1] + s * this.mitres[side][i + 1][1];
    const y0 = Math.max(upper, yA);
    const y1 = Math.min(lower, yB);
    if (y0 > y1) return Infinity;
    return tightest(
      ys[i] + s * ny,
      sign * (xs[i] + s * nx),
      ys[i + 1] + s * ny,
      sign * (xs[i + 1] + s * nx),
      y,
      FOUNTAIN_DOT_RADIUS,
      y0,
      y1,
    );
  }
}

/**
 * The least of side(y') - sqrt(rho^2 - (y' - y)^2) over y' in [y0, y1], where side is
 * the straight piece from (ya, va) to (yb, vb): the furthest a disc centred on row y
 * may sit toward that side. The expression is convex in y', so its least value is at
 * the stationary point, clamped to the interval.
 */
function tightest(
  ya: number,
  va: number,
  yb: number,
  vb: number,
  y: number,
  rho: number,
  y0: number,
  y1: number,
): number {
  const m = (vb - va) / (yb - ya);
  const at = Math.min(y1, Math.max(y0, y - (m * rho) / Math.sqrt(1 + m * m)));
  const u = at - y;
  return va + m * (at - ya) - Math.sqrt(Math.max(0, rho * rho - u * u));
}

/** A bell plus its big dot and stem, the two things the small dots keep clear of. */
export interface PackBell extends FountainBell {
  /** y of the big dot (at cx, never drifted) */
  valueY: number;
  /** y of the baseline (0), where the stem starts; the stem runs from here to valueY.
   * Default: below the big dot (the stem of a positive value). */
  baselineY?: number;
  /** Radius of the big dot (px, default FOUNTAIN_BIG_DOT_RADIUS; fountainBigDotRadius) */
  bigR?: number;
}

/** One packed small dot. */
export interface PackedDot {
  /** The sample it stands for */
  value: number;
  x: number;
  /** Exactly y(value) */
  y: number;
}

/** Where a small dot may go in one row, as offsets from cx. */
interface RowRoom {
  py: number;
  /** Its disc within the allowance of the outline, or, where no spot is (just under the
   * tip), within a hair of the least it can be. */
  allowed: [number, number];
  /** No spot keeps within the allowance: `allowed` is round the row's best. */
  tip: boolean;
  /** Its whole disc inside the outline, and EDGE_GAP further in (null where it cannot
   * be; undefined until asked). */
  inside?: [number, number] | null;
  inner?: [number, number] | null;
  /** No clear candidate is left in this row (it only fills up). */
  crowded: boolean;
  /** Every spot in `allowed` is on a dot already there, or no better. */
  full: boolean;
}

/** Index of the first key > target in ascending `keys`. */
function upperBound(keys: ReadonlyArray<number>, target: number): number {
  let lo = 0;
  let hi = keys.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (keys[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** No neighbour (dx offsets, squared y distances) within one spacing of dx. */
function isClear(nbDx: Float64Array, nbEy2: Float64Array, nb: number, dx: number): boolean {
  const D2 = FOUNTAIN_DOT_SPACING * FOUNTAIN_DOT_SPACING;
  for (let i = 0; i < nb; i++) {
    const ex = nbDx[i] - dx;
    if (ex * ex + nbEy2[i] < D2) return false;
  }
  return true;
}

/**
 * How badly a dot at dx overlaps its neighbours: `fixed`, plus the largest overlap
 * (px, at least `floor`), plus a quarter of the summed overlap (each approximated as
 * (D^2 - d^2) / 2D, no square roots), plus STACKED when it sits on another dot (closer
 * than STACK_GAP). Infinity as soon as it cannot beat `ceiling`.
 */
function overlapCost(
  nbDx: Float64Array,
  nbEy2: Float64Array,
  nb: number,
  dx: number,
  floor: number,
  fixed: number,
  ceiling: number,
): number {
  const D = FOUNTAIN_DOT_SPACING;
  const D2 = D * D;
  let minD2 = D2;
  let max = floor;
  let sum = 0;
  let stacked = 0;
  for (let i = 0; i < nb; i++) {
    const ex = nbDx[i] - dx;
    const d2 = ex * ex + nbEy2[i];
    if (d2 >= D2) continue;
    if (d2 < minD2) {
      minD2 = d2;
      max = Math.max(floor, D - Math.sqrt(d2));
      if (d2 < STACK_GAP * STACK_GAP) stacked = STACKED;
    }
    sum += (D2 - d2) / (2 * D);
    if (fixed + stacked + max + 0.25 * sum > ceiling) return Infinity;
  }
  return fixed + stacked + max + 0.25 * sum;
}

/**
 * Pack one small dot per sample inside the bell (a deterministic beeswarm). Samples
 * are placed lowest first; each keeps its exact y and takes the first clear sideways
 * position, trying outward from where it would naturally sit:
 *
 * - Where nothing is in the way, the first candidate is the bell's (drifted) centre,
 *   then half a dot spacing further out each side in turn. So the highest sample sits
 *   on the tip.
 * - Beside the stem (every row from the baseline to the big dot, and
 *   FOUNTAIN_LANE_REACH px past it) the candidates start FOUNTAIN_LANE_OFFSET from
 *   the stem, keeping its lane clear. The stem and the big dot stand at cx, whatever
 *   the drift.
 * - Near the big dot the candidates start just clear of its ring, so a sample at (or
 *   near) the value sits beside the big dot, never under it.
 *
 * Where a dot may go is one measure: how far its disc goes past the drawn outline
 * (bellOutline's polygon, drift and sloping sides included; not past the flat base,
 * which a dot at `low` hangs half below, nor above the tip's row, which the highest
 * dot pokes over). In each row, in strict priority:
 *
 * 1. At most half the outline's stroke past it, wherever its row has such a spot (all
 *    but the few px just under the tip); else as little as the row allows.
 * 2. Not wholly under the big dot (drawn on top), then showing clearly past it.
 * 3. Not on another small dot (centres at least 0.5 px apart), then overlapping as
 *    little as it can.
 * 4. Clear of the stem's lane.
 *
 * A clear candidate meets all four: tried with a small gap inside the outline first,
 * then wholly inside it, then within the stroke. When none is clear, the dot takes the
 * spot in its row that costs least by those priorities, searched across the whole
 * row: a coarse pass, a finer one round the best, and, if that still sits on a dot,
 * the gaps the row's dots leave.
 *
 * Earlier dots are looked up by height (only those within a dot spacing in y can
 * touch), so a jet of thousands of samples packs in a few milliseconds.
 */
export function packFountainDots(
  samples: ReadonlyArray<number>,
  y: (v: number) => number,
  bell: PackBell,
): PackedDot[] {
  const D = FOUNTAIN_DOT_SPACING;
  const R = FOUNTAIN_DOT_RADIUS;
  const step = D * 0.5;
  const bigOuter = (bell.bigR ?? FOUNTAIN_BIG_DOT_RADIUS) + BIG_DOT_RING;
  // Centre distance at which a small dot just clears the big dot's ring.
  const bigClear = bigOuter + R;
  // The stem's rows, extended past the big dot (away from the baseline).
  const baseline = bell.baselineY ?? Infinity;
  const laneLo =
    baseline >= bell.valueY ? bell.valueY - FOUNTAIN_LANE_REACH : Math.min(baseline, bell.valueY);
  const laneHi =
    baseline >= bell.valueY ? Math.max(baseline, bell.valueY) : bell.valueY + FOUNTAIN_LANE_REACH;
  const outline = new OutlineFit(bell);
  // The last row's room: a row's dots come one after another (the samples are sorted).
  let room: RowRoom | null = null;
  const roomOf = (py: number, sx: number, half: number): RowRoom => {
    if (room?.py === py) return room;
    let allowed = outline.within(py, ALLOWANCE);
    const tip = !allowed;
    if (!allowed) {
      // No spot keeps within the allowance (just under the tip): the least the disc can
      // go past the outline in this row, found by halving, and a hair more where that
      // least is past the stroke anyway.
      let [ok, bad] = [R + 1, ALLOWANCE];
      if (outline.within(py, ok)) {
        for (let k = 0; k < BEST_STEPS; k++) {
          const mid = (ok + bad) / 2;
          if (outline.within(py, mid)) ok = mid;
          else bad = mid;
        }
        allowed = outline.within(py, ok < HALF_STROKE ? ok : ok + TIP_SLACK);
      }
    }
    // A range with no height draws no outline: its dots keep within its one row.
    if (!allowed) allowed = half >= R ? [sx - (half - R), sx + (half - R)] : [sx, sx];
    return (room = { py, allowed, tip, crowded: false, full: false });
  };

  // Placed dots sorted by -y (samples go lowest first, so each new dot usually sits
  // above the others and is appended): the y-bounded neighbour scan.
  const keys: number[] = [];
  const dxs: number[] = [];
  // This dot's neighbours (within one spacing in y), nearest in y first.
  const nbDx = new Float64Array(Math.max(1, samples.length));
  const nbEy2 = new Float64Array(Math.max(1, samples.length));
  let nb = 0;
  // The crowded row being filled, if any.
  let grid = null as CrowdGrid | null;
  const sorted = [...samples].sort((a, b) => a - b);
  const out: PackedDot[] = [];

  for (let idx = 0; idx < sorted.length; idx++) {
    const v = sorted[idx];
    const py = y(v);
    const row = outline.rowAt(py);
    const sx = row.centre;
    const dy = py - bell.valueY;
    // Offsets from cx closer than `gap` are in the way (the stem's lane, the big dot).
    const lane = py >= laneLo && py <= laneHi ? FOUNTAIN_LANE_OFFSET : 0;
    const big = Math.abs(dy) < bigClear ? Math.sqrt(bigClear * bigClear - dy * dy) : 0;
    const gap = Math.max(lane, big);

    // Where the dot may go, as offsets from cx (the same for every dot in a row).
    const here = roomOf(py, sx, row.half);

    // Earlier dots within one spacing in y, nearest first (they are the likeliest hits).
    const key = -py;
    const at = upperBound(keys, key);
    nb = 0;
    for (let i = at - 1, j = at; ;) {
      const di = i >= 0 ? key - keys[i] : Infinity;
      const dj = j < keys.length ? keys[j] - key : Infinity;
      const d = Math.min(di, dj);
      if (!(d < D)) break;
      const k = di <= dj ? i-- : j++;
      nbDx[nb] = dxs[k];
      nbEy2[nb] = d * d;
      nb++;
    }

    // Just under the tip, where no spot keeps within the allowance, the dot's spot is a
    // sliver round the row's best: too narrow for two dots apart, it takes the point of
    // it nearest the row's centre.
    let best: number | null = null;
    if (here.tip && here.allowed[1] - here.allowed[0] < STACK_GAP) {
      best = Math.min(here.allowed[1], Math.max(here.allowed[0], sx));
    }

    // 1. The first clear candidate: EDGE_GAP inside the outline, then wholly inside it,
    // then within the allowance (each tier tries only what the one before did not). A
    // row where an earlier dot found none has none: it only fills up.
    let prev: [number, number] | null = null;
    for (let tier = 0; tier < 3 && best === null && !here.crowded; tier++) {
      if (tier === 0 && here.inner === undefined) here.inner = outline.fit(py, R + EDGE_GAP);
      if (tier === 1 && here.inside === undefined) here.inside = outline.within(py, 0);
      const t = tier === 0 ? here.inner! : tier === 1 ? here.inside! : here.allowed;
      if (!t) continue;
      for (const dx of candidates(t[0], t[1], sx, gap, step)) {
        if (prev && dx >= prev[0] - 1e-9 && dx <= prev[1] + 1e-9) continue;
        if (isClear(nbDx, nbEy2, nb, dx)) {
          best = dx;
          break;
        }
      }
      prev = t;
    }

    // 2. A crowded row: the position within the allowance that overlaps least. A coarse
    // pass across it, then a finer one around the best.
    if (best === null) {
      here.crowded = true;
      const [lo, hi] = here.allowed;
      // What a spot costs whatever the other small dots do; how far the big dot's ring
      // overlaps it is left in `bigHit`.
      let bigHit = 0;
      const fixedAt = (dx: number): number => {
        const dist = Math.sqrt(dx * dx + dy * dy);
        bigHit = Math.max(0, bigClear - dist);
        const laneHit = lane ? Math.max(0, lane - Math.abs(dx)) : 0;
        // How much of the dot shows past the big dot's ring (px). Hidden under it is
        // the worst; barely showing is next, the less the worse; both are worse than
        // stacking on a small dot, which is worse than overlapping one. The big dot's
        // edge counts among the overlaps and again on its own, px for px: what it
        // covers of a dot is lost whatever else the dot touches.
        const shows = dist + R - bigOuter;
        const hidden =
          shows <= 0
            ? HIDDEN * (1 - shows)
            : shows < MIN_VISIBLE
              ? BARELY * (1 - shows / MIN_VISIBLE)
              : 0;
        return hidden + laneHit + bigHit;
      };
      let bestCost = Infinity;
      let bestDx = sx;
      const costAt = (dx: number): void => {
        const fixed = fixedAt(dx);
        const cost = overlapCost(nbDx, nbEy2, nb, dx, bigHit, fixed, bestCost);
        if (cost < bestCost - 1e-9) {
          bestCost = cost;
          bestDx = dx;
        }
      };
      // The coarse pass is the same for every dot of a row, and a row's dots come one
      // after another: where more follow, its costs are kept as the row fills.
      if (grid?.py !== py && sorted[idx + 1] === v) {
        grid = new CrowdGrid(py, coarseSpots(lo, hi, sx), nbDx, nbEy2, nb);
        for (let k = 0; k < grid.xs.length; k++) grid.fix(k, fixedAt(grid.xs[k]), bigHit);
      }
      if (grid?.py === py) {
        for (let k = 0; k < grid.xs.length; k++) {
          const cost = grid.cost(k);
          if (cost < bestCost - 1e-9) {
            bestCost = cost;
            bestDx = grid.xs[k];
          }
        }
      } else {
        for (const dx of coarseSpots(lo, hi, sx)) costAt(dx);
      }
      if (hi - lo > 1e-9) {
        const around = bestDx;
        const fine = (hi - lo) / CROWD_STEPS / (CROWD_REFINE + 1);
        for (let k = 1; k <= CROWD_REFINE; k++) {
          for (const dx of [around - k * fine, around + k * fine]) {
            if (dx >= lo - 1e-9 && dx <= hi + 1e-9) costAt(dx);
          }
        }
      }
      // Still on another dot (or worse): try the gaps the row's dots leave where a dot
      // shows at least MIN_VISIBLE past the big dot (nowhere else beats sitting on a dot),
      // unless an earlier dot of this row found none better (the row only fills up). A
      // dot shows most at the outermost gaps' far ends, and overlaps least in the middle
      // of the widest gaps.
      if (bestCost >= STACKED && !here.full) {
        const reach = bigOuter - R + MIN_VISIBLE;
        const c = reach > Math.abs(dy) ? Math.sqrt(reach * reach - dy * dy) : 0;
        const seen: Array<[number, number]> =
          c > 0
            ? ([
                [lo, Math.min(hi, -c)],
                [Math.max(lo, c), hi],
              ].filter(([a, b]) => a <= b) as Array<[number, number]>)
            : [[lo, hi]];
        const gaps = stackGaps(nbDx, nbEy2, nb, seen);
        if (gaps.length) {
          costAt(gaps[0][0]);
          costAt(gaps[gaps.length - 1][1]);
          const widest = gaps
            .map(([a, b], k) => [b - a, k] as const)
            .sort((p, q) => q[0] - p[0] || p[1] - q[1]);
          for (const [, k] of widest.slice(0, GAP_TRIES)) {
            costAt((gaps[k][0] + gaps[k][1]) / 2);
          }
        }
        if (bestCost >= STACKED) here.full = true;
      }
      best = bestDx;
    }

    const dx = best;
    if (grid) {
      if (grid.py === py) grid.add(dx);
      else grid = null;
    }
    keys.splice(at, 0, key);
    dxs.splice(at, 0, dx);
    out.push({ value: v, x: bell.cx + dx, y: py });
  }

  return out;
}

/**
 * A crowded row's coarse pass: the row's centre (or its nearest point), then outward in
 * CROWD_STEPS across the row, alternating sides so ties keep the nearest, then its two
 * ends.
 */
function coarseSpots(lo: number, hi: number, sx: number): number[] {
  const c0 = Math.min(hi, Math.max(lo, sx));
  const xs = [c0];
  if (hi - lo > 1e-9) {
    const pitch = (hi - lo) / CROWD_STEPS;
    for (let k = 1; ; k++) {
      const l = c0 - k * pitch;
      const r = c0 + k * pitch;
      const lin = l >= lo - 1e-9;
      const rin = r <= hi + 1e-9;
      if (!lin && !rin) break;
      if (lin) xs.push(l);
      if (rin) xs.push(r);
    }
    xs.push(lo, hi);
  }
  return xs;
}

/**
 * The coarse pass of one crowded row and what each of its spots overlaps: the nearest
 * small dot (squared distance) and the summed overlap, as overlapCost counts them. Each
 * dot placed in the row adds to them, so a row of many ties is not rescanned per dot.
 */
class CrowdGrid {
  private readonly fixed: Float64Array;
  private readonly floor: Float64Array;
  private readonly minD2: Float64Array;
  private readonly sum: Float64Array;

  constructor(
    readonly py: number,
    readonly xs: number[],
    nbDx: Float64Array,
    nbEy2: Float64Array,
    nb: number,
  ) {
    const n = xs.length;
    this.fixed = new Float64Array(n);
    this.floor = new Float64Array(n);
    this.minD2 = new Float64Array(n).fill(FOUNTAIN_DOT_SPACING * FOUNTAIN_DOT_SPACING);
    this.sum = new Float64Array(n);
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < nb; i++) this.touch(k, nbDx[i], nbEy2[i]);
    }
  }

  private touch(k: number, dx: number, ey2: number): void {
    const D = FOUNTAIN_DOT_SPACING;
    const ex = dx - this.xs[k];
    const d2 = ex * ex + ey2;
    if (d2 >= D * D) return;
    if (d2 < this.minD2[k]) this.minD2[k] = d2;
    this.sum[k] += (D * D - d2) / (2 * D);
  }

  /** What spot k costs whatever the other small dots do, and the big dot's overlap. */
  fix(k: number, fixed: number, floor: number): void {
    this.fixed[k] = fixed;
    this.floor[k] = floor;
  }

  /** A dot placed at dx in this row. */
  add(dx: number): void {
    for (let k = 0; k < this.xs.length; k++) this.touch(k, dx, 0);
  }

  /** What spot k costs now (overlapCost's sum). */
  cost(k: number): number {
    const D = FOUNTAIN_DOT_SPACING;
    const m = this.minD2[k];
    const max = m < D * D ? Math.max(this.floor[k], D - Math.sqrt(m)) : this.floor[k];
    const stacked = m < STACK_GAP * STACK_GAP ? STACKED : 0;
    return this.fixed[k] + stacked + max + 0.25 * this.sum[k];
  }
}

/**
 * The parts of `room` (pieces [a, b], in order) where a dot sits on no other (no
 * neighbour's centre within STACK_GAP), a hair in from their ends. The neighbours that
 * can be that close are the first ones (nearest in y first). None when more of them than
 * the room holds apart are that close in y: the room is full.
 */
function stackGaps(
  nbDx: Float64Array,
  nbEy2: Float64Array,
  nb: number,
  room: Array<[number, number]>,
): Array<[number, number]> {
  const G2 = STACK_GAP * STACK_GAP;
  let m = 0;
  while (m < nb && nbEy2[m] < G2) m++;
  let most = 0;
  for (const [a, b] of room) most += (b - a) / STACK_GAP + 1;
  if (m > most) return [];
  const cover: Array<[number, number]> = [];
  for (let i = 0; i < m; i++) {
    const w = Math.sqrt(G2 - nbEy2[i]);
    cover.push([nbDx[i] - w, nbDx[i] + w]);
  }
  cover.sort((a, b) => a[0] - b[0]);
  const gaps: Array<[number, number]> = [];
  const hair = 1e-6;
  for (const [lo, hi] of room) {
    let from = lo;
    for (const [a, b] of cover) {
      if (b <= from) continue;
      if (a > hi) break;
      if (a > from + 2 * hair) gaps.push([from + (from > lo ? hair : 0), Math.min(a, hi) - hair]);
      from = Math.max(from, b);
    }
    if (from <= hi) gaps.push([from + (from > lo ? hair : 0), hi]);
  }
  return gaps.filter(([a, b]) => a <= b);
}

/**
 * Candidate offsets from cx within [lo, hi] for a row centred at sx (the drift),
 * nearest first. With nothing in the way (gap 0): the centre (or the nearest point of
 * the row to it), then left and right in turn, half a spacing further out each time.
 * With the stem or the big dot in the way: right and left in turn from `gap` outward,
 * plus the row's last position on each side.
 */
function candidates(lo: number, hi: number, sx: number, gap: number, step: number): number[] {
  const out: number[] = [];
  if (gap <= 0) {
    const c0 = Math.min(hi, Math.max(lo, sx));
    out.push(c0);
    for (let k = 1; ; k++) {
      const l = c0 - k * step;
      const r = c0 + k * step;
      const lin = l >= lo - 1e-9;
      const rin = r <= hi + 1e-9;
      if (!lin && !rin) break;
      if (lin) out.push(l);
      if (rin) out.push(r);
    }
    return out;
  }
  const right: number[] = [];
  const left: number[] = [];
  for (let off = gap; off <= Math.max(Math.abs(lo), Math.abs(hi)) + 1e-9; off += step) {
    if (off >= lo - 1e-9 && off <= hi + 1e-9) right.push(off);
    if (-off >= lo - 1e-9 && -off <= hi + 1e-9) left.push(-off);
  }
  // The last position on each side, when the grid stops short of it.
  if (hi >= gap && (right.length === 0 || hi - right[right.length - 1] > 0.05)) right.push(hi);
  if (lo <= -gap && (left.length === 0 || left[left.length - 1] - lo > 0.05)) left.push(lo);
  for (let k = 0; k < Math.max(right.length, left.length); k++) {
    if (k < right.length) out.push(right[k]);
    if (k < left.length) out.push(left[k]);
  }
  return out;
}
