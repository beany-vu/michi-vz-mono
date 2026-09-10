// Opt-in Canvas 2D renderer for RadarChart. Grid + series polygons + pole points;
// fill resolved via the SVG colour probe (resolveMarkColors `radar-area`/fill).
// jsdom → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeMultiPropProbe } from "../canvas/resolveMarkColors";
import type { RadarRenderModel } from "./renderModel";

export interface RadarCanvasOptions {
  width: number;
  height: number;
  fillOpacity: number;
  /** Fill dimmed polygons as a soft background (default true). */
  dimmedFill?: boolean;
  /** Progressive-draw reveal cutoff: only pixels at x <= revealX are painted
   *  (a ctx.clip rect, matching the SVG renderer's <clipPath> reveal). Note the
   *  grid is drawn UNCLIPPED (it is the axes equivalent), so only this option
   *  affects the grid+polygon draw calls made after the clip is installed below. */
  revealX?: number;
}

function polyPath(points: string): Path2D {
  const p = new Path2D();
  points.split(" ").forEach((pair, i) => {
    const [x, y] = pair.split(",").map(Number);
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  });
  p.closePath();
  return p;
}

export function drawRadarCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: RadarRenderModel,
  o: RadarCanvasOptions,
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;
  const g = model.grid;

  // Grid: dashed concentric circles + solid spokes (legacy parity).
  ctx.strokeStyle = "lightgray";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  for (const rr of g.rings) {
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (const sp of g.spokes) {
    ctx.beginPath();
    ctx.moveTo(g.cx, g.cy);
    ctx.lineTo(sp.x, sp.y);
    ctx.stroke();
  }

  const labels = model.series.map((s) => s.label);
  const fallback = new Map(model.series.map((s) => [s.label, s.color]));
  // The MonitorV2 consumer colours radar polygons via CSS `polygon[data-label-safe^=…]
  // { stroke: … }`, so probe STROKE first, falling through to fill for a plainer
  // consumer that only sets `.radar-area { fill: ... }`. Both candidate properties
  // are seeded with the sentinel "none" (makeMultiPropProbe), not the real fallback
  // colour - seeding a real colour on `stroke` (checked first) would make it "win"
  // every time (its computed value is always non-none) and a fill-only consumer's
  // CSS would never be reached, painting every polygon with the wrong colour.
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeMultiPropProbe("polygon", "radar-area", ["stroke", "fill"]),
    ["stroke", "fill"],
  );

  // Progressive-draw reveal cutoff: only clips the series polygons below, never
  // the grid drawn above (the grid is the axes equivalent here).
  if (o.revealX !== undefined) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, Math.max(0, o.revealX), o.height);
    ctx.clip();
  }

  for (const s of model.series) {
    const color = fillColors.get(s.label) || s.color;
    const path = polyPath(s.points);
    ctx.save();
    // Dimmed (e.g. non-current-year) series stay visible as a soft background - a bit
    // more opaque than a bare hint, closer to the legacy seriesAlpha ~0.2.
    ctx.fillStyle = color;
    ctx.globalAlpha = s.dimmed ? (o.dimmedFill === false ? 0 : 0.12) : o.fillOpacity;
    ctx.fill(path);
    ctx.globalAlpha = s.dimmed ? 0.3 : 1;
    ctx.strokeStyle = color;
    // The active (current) path is drawn thicker so it stands out over the dimmed ones.
    ctx.lineWidth = s.dimmed ? 2 : 3;
    ctx.stroke(path);
    // Pole dots only on the active series - dimmed years are non-interactive
    // background context (no dots, and not hit-tested; see ./hover.ts).
    if (!s.dimmed) {
      ctx.fillStyle = color;
      for (const p of s.poles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  if (o.revealX !== undefined) ctx.restore();
}
