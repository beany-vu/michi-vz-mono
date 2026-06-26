// Opt-in Canvas 2D renderer for RadarChart. Grid + series polygons + pole points;
// fill resolved via the SVG colour probe (resolveMarkColors `radar-area`/fill).
// jsdom → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { RadarRenderModel } from "./renderModel";

export interface RadarCanvasOptions {
  width: number;
  height: number;
  fillOpacity: number;
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
  o: RadarCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;
  const g = model.grid;

  // Grid.
  ctx.strokeStyle = "lightgray";
  ctx.lineWidth = 1;
  for (const ring of g.rings) ctx.stroke(polyPath(ring));
  for (const sp of g.spokes) {
    ctx.beginPath();
    ctx.moveTo(g.cx, g.cy);
    ctx.lineTo(sp.x, sp.y);
    ctx.stroke();
  }

  const labels = model.series.map((s) => s.label);
  const fallback = new Map(model.series.map((s) => [s.label, s.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("polygon", "radar-area", "fill"),
    "fill"
  );

  for (const s of model.series) {
    const color = fillColors.get(s.label) || s.color;
    const path = polyPath(s.points);
    ctx.save();
    ctx.globalAlpha = s.dimmed ? 0.15 : 1;
    ctx.fillStyle = color;
    ctx.globalAlpha = s.dimmed ? 0.05 : o.fillOpacity;
    ctx.fill(path);
    ctx.globalAlpha = s.dimmed ? 0.15 : 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke(path);
    ctx.fillStyle = color;
    for (const p of s.poles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
