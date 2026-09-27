// EXPERIMENTAL opt-in WebGPU renderer for FountainChart: draws the shared render model
// with the flat MarkBatch layer (triangles + instanced circles), the same marks,
// opacities and dashes as SVG and canvas (SPEC section 4). The bell is filled as a
// strip between its left and right sides (exact for a drifting bell too); forecast
// outlines and stems are dashed through the shared pushDashedStroke. Colours come
// from the same per-jet light-DOM probe as canvas. Text stays SVG. There is no reveal
// clip on the GPU: the engine keeps timeline / progressiveDraw off here and warns.
// Nor a knockout clip: a forecast's hollow big dot is a colour ring with nothing
// painted inside, and its stem and the trend line stop at the ring (the forecast's own
// light fill still shows through it).
// Device acquisition is async; while not ready this returns false and the engine
// paints the canvas-2D stopgap, then re-renders on onReady.
import {
  drawMarksWebgpu,
  emptyBatch,
  pushBandStrip,
  pushCircle,
  pushDashedStroke,
  pushRect,
  pushStroke,
  markColor,
  type MarkBatch,
} from "../webgpu/marks";
import { fountainPaintColors, type FountainPaintTheme } from "./renderCanvas";
import { FOUNTAIN_DIM_OPACITY, FOUNTAIN_LAKE_HEIGHT } from "./renderSvg";
import type { FountainJetModel, FountainRenderModel } from "./renderModel";

export interface FountainWebgpuOptions extends FountainPaintTheme {
  width: number;
  height: number;
  /** Called once when the GPU device becomes ready, so the engine re-renders. */
  onReady?: () => void;
}

/** The bell's left side (base to tip) and right side (base to tip), row by row. */
function bellSides(points: ReadonlyArray<[number, number]>): {
  left: Array<[number, number]>;
  right: Array<[number, number]>;
} {
  // bellOutline: n + 1 points up the left side (tip last), then n down the right.
  const n = (points.length - 1) / 2;
  const left = points.slice(0, n + 1) as Array<[number, number]>;
  const right = [...(points.slice(n + 1) as Array<[number, number]>)].reverse();
  right.push(left[n]);
  return { left, right };
}

/** A circle as a closed polygon (for a ring stroked with pushStroke). */
function circlePoints(x: number, y: number, r: number, n = 48): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
  }
  return pts;
}

/** Move `to` back towards `from` by `cut` px; null when the segment is shorter. */
function cutEnd(
  from: [number, number],
  to: [number, number],
  cut: number,
): [number, number] | null {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  if (len <= cut) return null;
  const k = (len - cut) / len;
  return [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k];
}

/**
 * The trend line as runs that stop at each hollow big dot's ring (the line goes
 * through the big dots' centres): split at every hollow vertex, each end cut back to
 * the ring's inner edge. Without hollow dots: the whole line, one run.
 */
function trendRuns(
  pts: Array<[number, number]>,
  holes: ReadonlyArray<{ x: number; y: number; r: number }>,
): Array<Array<[number, number]>> {
  const holeAt = (p: [number, number]) =>
    holes.find((h) => Math.abs(h.x - p[0]) < 1e-6 && Math.abs(h.y - p[1]) < 1e-6);
  const runs: Array<Array<[number, number]>> = [];
  let run: Array<[number, number]> = [];
  for (const p of pts) {
    run.push(p);
    if (holeAt(p) && run.length > 1) {
      runs.push(run);
      run = [p];
    }
  }
  if (run.length > 1) runs.push(run);
  const out: Array<Array<[number, number]>> = [];
  for (const r of runs) {
    let pts2 = [...r];
    const first = holeAt(pts2[0]);
    if (first) {
      const cut = cutEnd(pts2[1], pts2[0], first.r);
      if (!cut) continue;
      pts2[0] = cut;
    }
    const last = holeAt(pts2[pts2.length - 1]);
    if (last) {
      const cut = cutEnd(pts2[pts2.length - 2], pts2[pts2.length - 1], last.r);
      if (!cut) continue;
      pts2 = [...pts2.slice(0, -1), cut];
    }
    out.push(pts2);
  }
  return out;
}

/** The mark batch for one frame (pure, so it is testable without a GPU). */
export function buildFountainWebgpuBatch(
  model: FountainRenderModel,
  colorOf: (jet: FountainJetModel) => string,
  theme: FountainPaintTheme,
): MarkBatch {
  const batch = emptyBatch();
  const tri = batch.triangles;

  pushRect(
    tri,
    model.lake.x0,
    model.lake.y,
    model.lake.x1 - model.lake.x0,
    FOUNTAIN_LAKE_HEIGHT,
    markColor(theme.lake, 0.3),
  );
  for (const line of model.referenceLines) {
    pushDashedStroke(
      tri,
      [
        [line.x0, line.y],
        [line.x1, line.y],
      ],
      1.2,
      markColor(theme.attention),
      5,
      4,
    );
  }
  // The inside of each hollow big dot (its 2 px ring is centred on r).
  const holes = model.jets
    .filter((j) => j.bigDot.hollow)
    .map((j) => ({ x: j.bigDot.x, y: j.bigDot.y, r: Math.max(0, j.bigDot.r - 1) }));
  if (model.trendLine) {
    const line = model.trendLine.map((p) => [p.x, p.y] as [number, number]);
    for (const run of trendRuns(line, holes)) {
      pushDashedStroke(tri, run, 1.2, markColor(theme.ink, 0.45), 3, 3);
    }
  }

  for (const jet of model.jets) {
    const color = colorOf(jet);
    const dim = jet.dimmed ? FOUNTAIN_DIM_OPACITY : 1;

    const s = jet.stem;
    const b = jet.bigDot;
    // A hollow big dot's stem stops at its ring.
    const stemEnd: [number, number] | null = b.hollow
      ? cutEnd([s.x, s.y0], [s.x, s.y1], Math.max(0, b.r - 1))
      : [s.x, s.y1];
    if (s.dashed) {
      if (stemEnd) {
        pushDashedStroke(
          tri,
          [[s.x, s.y0], stemEnd],
          Math.max(1, s.width - 1.2),
          markColor(color, dim * 0.75),
          5,
          4,
        );
      }
    } else {
      pushRect(
        tri,
        s.x - s.width / 2,
        Math.min(s.y0, s.y1),
        s.width,
        Math.abs(s.y0 - s.y1),
        markColor(color, dim * 0.75),
      );
    }

    if (jet.bell) {
      const ring = jet.bell.points;
      const { left, right } = bellSides(ring);
      pushBandStrip(tri, left, right, markColor(color, dim * (jet.bell.dashed ? 0.06 : 0.13)));
      const outline = markColor(color, dim * (jet.bell.dashed ? 0.6 : 0.7));
      const closed = [...ring, ring[0]] as Array<[number, number]>;
      if (jet.bell.dashed) pushDashedStroke(tri, closed, 1.2, outline, 4, 3);
      else pushStroke(tri, closed, 1.2, outline);
    }

    for (const d of jet.dots) {
      pushCircle(batch.circles, d.x, d.y, d.r + 0.35, markColor(theme.surface, dim));
      pushCircle(batch.circles, d.x, d.y, d.r - 0.35, markColor(color, dim * 0.9));
    }

    if (b.hollow) {
      // A colour ring, nothing inside: hollow on any background.
      pushStroke(tri, circlePoints(b.x, b.y, b.r), 2, markColor(color, dim));
    } else {
      pushCircle(batch.circles, b.x, b.y, b.r + 1, markColor(theme.surface, dim));
      pushCircle(batch.circles, b.x, b.y, b.r - 1, markColor(color, dim));
    }
  }
  return batch;
}

export function drawFountainWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: FountainRenderModel,
  o: FountainWebgpuOptions,
): boolean {
  const colorOf = fountainPaintColors(svg, model.jets);
  const batch = buildFountainWebgpuBatch(model, colorOf, o);
  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
