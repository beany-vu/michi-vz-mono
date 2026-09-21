// Pure geometry for partial-sweep gauge layout. Angles are DEGREES clockwise
// from 12 o'clock (the gauge/pie convention). A unit point at angle a is
// (sin a, -cos a): top (0,-1), right (1,0), bottom (0,1), left (-1,0).
// Everything here is DOM-free so the engine, tests and consumers agree.

export interface SweepBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const FULL = 360;
const EPS = 1e-9;

function normDeg(a: number): number {
  return ((a % FULL) + FULL) % FULL;
}

function unitPoint(deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [Math.sin(a), -Math.cos(a)];
}

/** Snap floating-point noise (and -0) to a clean 0 so boxes compare exactly. */
const snap = (v: number): number => (Math.abs(v) < EPS ? 0 : v);

/**
 * Bounding box, at radius 1, of the arc swept clockwise from `startAngleDeg`
 * over `sweepAngleDeg`. The candidates are the two end points plus every
 * compass point (top, right, bottom, left) inside the sweep. A sweep <= 0 or
 * >= 360 is a full ring and returns the unit square, so a fit on a full ring
 * reproduces the plain centred layout by construction.
 */
export function sweepBoundingBox(startAngleDeg: number, sweepAngleDeg: number): SweepBox {
  if (!Number.isFinite(sweepAngleDeg) || sweepAngleDeg <= 0 || sweepAngleDeg >= FULL - EPS) {
    return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  }
  const start = normDeg(startAngleDeg);
  const pts: Array<[number, number]> = [unitPoint(start), unitPoint(start + sweepAngleDeg)];
  for (const compass of [0, 90, 180, 270]) {
    if (normDeg(compass - start) <= sweepAngleDeg + EPS) pts.push(unitPoint(compass));
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX: snap(minX), minY: snap(minY), maxX: snap(maxX), maxY: snap(maxY) };
}

export interface FitSweepInput {
  plotLeft: number;
  plotTop: number;
  plotW: number;
  plotH: number;
  /** Band kept free on every side (annotation labels), in px. */
  reserve: number;
  /** Unit box from sweepBoundingBox(). */
  box: SweepBox;
  /** Consumer-forced outer radius; when set only the placement is fitted. */
  outerRadius?: number | null;
}

export interface FitSweepResult {
  /** Ring centre. */
  cx: number;
  cy: number;
  /** Outer edge radius of the outermost ring. */
  outerRadius: number;
  /** Midpoint of the swept box: where the centre readout goes. */
  anchorX: number;
  anchorY: number;
}

/**
 * Size the radius so the swept box fills the plot minus the reserve, centre
 * that box in the plot, and derive the ring centre + readout anchor from it.
 */
export function fitSweep(i: FitSweepInput): FitSweepResult {
  const boxW = i.box.maxX - i.box.minX;
  const boxH = i.box.maxY - i.box.minY;
  const availW = Math.max(0, i.plotW - 2 * i.reserve);
  const availH = Math.max(0, i.plotH - 2 * i.reserve);
  const fitted = Math.min(boxW > 0 ? availW / boxW : Infinity, boxH > 0 ? availH / boxH : Infinity);
  const outerRadius =
    i.outerRadius != null && i.outerRadius > 0
      ? i.outerRadius
      : Number.isFinite(fitted)
        ? fitted
        : 0;
  const left = i.plotLeft + i.reserve + (availW - outerRadius * boxW) / 2;
  const top = i.plotTop + i.reserve + (availH - outerRadius * boxH) / 2;
  return {
    cx: left - outerRadius * i.box.minX,
    cy: top - outerRadius * i.box.minY,
    outerRadius,
    anchorX: left + (outerRadius * boxW) / 2,
    anchorY: top + (outerRadius * boxH) / 2,
  };
}
