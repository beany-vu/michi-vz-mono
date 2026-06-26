// Opt-in Canvas 2D renderer for ScatterPlot. Draws each point's mark; fill colour
// resolved via the SVG colour probe (resolveMarkColors `scatter-point`/fill) so
// consumer CSS reaches canvas pixels. jsdom → setupCanvas null → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { ScatterPointModel, ScatterRenderModel } from "./renderModel";

export interface ScatterCanvasOptions {
  width: number;
  height: number;
}

function drawMark(ctx: CanvasRenderingContext2D, p: ScatterPointModel, color: string): void {
  ctx.beginPath();
  if (p.shape === "square") {
    ctx.rect(p.cx - p.r, p.cy - p.r, p.r * 2, p.r * 2);
  } else if (p.shape === "triangle") {
    ctx.moveTo(p.cx, p.cy - p.r);
    ctx.lineTo(p.cx + p.r, p.cy + p.r);
    ctx.lineTo(p.cx - p.r, p.cy + p.r);
    ctx.closePath();
  } else {
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
  }
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

export function drawScatterCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: ScatterRenderModel,
  o: ScatterCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const labels = [...new Set(model.points.map((p) => p.label))];
  const fallback = new Map(model.points.map((p) => [p.label, p.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("circle", "scatter-point", "fill"),
    "fill"
  );

  for (const p of model.points) {
    ctx.save();
    ctx.globalAlpha = p.dimmed ? 0.1 : 0.9;
    drawMark(ctx, p, fillColors.get(p.label) || p.color);
    ctx.restore();
  }
}
