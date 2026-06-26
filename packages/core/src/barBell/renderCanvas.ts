// Opt-in Canvas 2D renderer for BarBell. Fill resolved via the SVG colour probe
// (resolveMarkColors `bar`/fill). jsdom → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { BarBellRenderModel } from "./renderModel";

export interface BarBellCanvasOptions {
  width: number;
  height: number;
}

export function drawBarBellCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: BarBellRenderModel,
  o: BarBellCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const keys = [...new Set(model.segments.map((s) => s.key))];
  const fallback = new Map(model.segments.map((s) => [s.key, s.color]));
  const fillColors = resolveMarkColors(
    svg,
    keys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("rect", "bar", "fill"),
    "fill"
  );

  // Pass 1: bars. Pass 2: end-cap circles on top (segments are adjacent, so a
  // later bar would otherwise cover the previous segment's cap).
  for (const seg of model.segments) {
    if (seg.width <= 0) continue;
    ctx.globalAlpha = seg.dimmed ? 0.15 : 1;
    ctx.fillStyle = fillColors.get(seg.key) || seg.color;
    ctx.beginPath();
    ctx.rect(seg.x, seg.cy - model.barHeight / 2, seg.width, model.barHeight);
    ctx.fill();
  }
  for (const seg of model.segments) {
    ctx.globalAlpha = seg.dimmed ? 0.15 : 1;
    ctx.fillStyle = fillColors.get(seg.key) || seg.color;
    ctx.beginPath();
    ctx.arc(seg.cx, seg.cy, model.capRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
