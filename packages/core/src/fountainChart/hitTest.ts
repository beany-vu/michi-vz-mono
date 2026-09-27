// FountainChart hover hit-test (pure; audit fountain #6). One rule for every
// renderer, by COLUMN, so a thin stem or a zero value is as easy to hover as a wide
// fountain, and neighbours never overlap:
// - snapshot: each jet owns its column, x centre +/- step / 2 (the columns tile the
//   plot);
// - trend: each period owns the span from the midpoint with its left neighbour to
//   the midpoint with its right one; the first and last columns run to the plot edges.
// Columns span the plot's height. When several jets share a column (duplicate labels
// or dates) the pointer's y picks the one whose painted marks it is over, else the
// nearest big dot. With `revealX` (timeline / progressive draw), a jet whose centre
// is not revealed yet cannot be hit.
import type { FountainJetModel, FountainRenderModel } from "./renderModel";

/** Extra px above and below the plot that still count (a big dot at the edge). */
const EDGE_TOLERANCE = 8;

export function hitTestFountain(
  model: FountainRenderModel,
  x: number,
  y: number,
  revealX?: number | null,
): FountainJetModel | null {
  const { plot, jets } = model;
  if (jets.length === 0) return null;
  if (x < plot.left || x > plot.right) return null;
  if (y < plot.top - EDGE_TOLERANCE || y > plot.bottom + EDGE_TOLERANCE) return null;

  // Distinct column centres, ascending.
  const centres = [...new Set(jets.map((j) => j.x))].sort((a, b) => a - b);
  let col: number;
  if (model.mode === "snapshot") {
    col = -1;
    const half = model.slotWidth / 2;
    for (let i = 0; i < centres.length; i++) {
      if (x >= centres[i] - half && x <= centres[i] + half) {
        col = i;
        break;
      }
    }
    if (col < 0) return null;
  } else {
    // Binary search for the last centre whose left boundary (midpoint) is <= x.
    let lo = 0;
    let hi = centres.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      const boundary = (centres[mid - 1] + centres[mid]) / 2;
      if (x >= boundary) lo = mid;
      else hi = mid - 1;
    }
    col = lo;
  }

  const cx = centres[col];
  let candidates = jets.filter((j) => j.x === cx);
  if (revealX !== undefined && revealX !== null) {
    candidates = candidates.filter((j) => j.x <= revealX);
  }
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const over = candidates.filter((j) => y >= j.painted.y0 && y <= j.painted.y1);
  const pool = over.length > 0 ? over : candidates;
  let best = pool[0];
  let bestD = Math.abs(y - best.bigDot.y);
  for (const j of pool.slice(1)) {
    const d = Math.abs(y - j.bigDot.y);
    if (d < bestD) {
      best = j;
      bestD = d;
    }
  }
  return best;
}
