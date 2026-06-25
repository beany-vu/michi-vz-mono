// Opt-in Canvas 2D renderer. Mirrors the SVG marks onto a <canvas> layered
// behind the <svg>. Mark colours are resolved through the SVG colour probe
// (resolveMarkColors) so consumer CSS (.gap-bar[data-label-safe] { fill }) reaches
// canvas pixels exactly as it does the SVG — the load-bearing light-DOM contract.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { GapRenderModel, GapElement } from "./renderModel";
import type { Shape } from "../types";

export interface GapCanvasOptions {
  width: number;
  height: number;
  shapeValue1: Shape;
  shapeValue2: Shape;
  squareRadius: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  x: number,
  cy: number,
  color: string,
  squareRadius: number
): void {
  ctx.fillStyle = color;
  if (shape === "square") {
    roundRect(ctx, x - 7, cy - 7, 14, 14, squareRadius);
    ctx.fill();
  } else if (shape === "triangle") {
    const R = 8;
    ctx.beginPath();
    ctx.moveTo(x, cy - R);
    ctx.lineTo(x + R * 0.866, cy + R / 2);
    ctx.lineTo(x - R * 0.866, cy + R / 2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(x, cy, 6.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawGapCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: GapRenderModel,
  o: GapCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return; // jsdom / no 2D context
  const { ctx } = setup;

  const labels = model.elements.map((e) => e.d.label);
  const byLabel = (pick: (e: GapElement) => string) => {
    const m = new Map<string, string>();
    model.elements.forEach((e) => m.set(e.d.label, pick(e)));
    return m;
  };
  const gapFallback = byLabel((e) => e.gapColor);
  const v1Fallback = byLabel((e) => e.value1Color);
  const v2Fallback = byLabel((e) => e.value2Color);

  const gapColors = resolveMarkColors(
    svg,
    labels,
    (l) => gapFallback.get(l) || "transparent",
    makeSimpleProbe("rect", "gap-bar", "fill"),
    "fill"
  );
  const v1Colors = resolveMarkColors(
    svg,
    labels,
    (l) => v1Fallback.get(l) || "transparent",
    makeSimpleProbe(o.shapeValue1 === "square" ? "rect" : "path", "gap-marker value1-marker", "fill"),
    "fill"
  );
  const v2Colors = resolveMarkColors(
    svg,
    labels,
    (l) => v2Fallback.get(l) || "transparent",
    makeSimpleProbe(o.shapeValue2 === "square" ? "rect" : "path", "gap-marker value2-marker", "fill"),
    "fill"
  );

  for (const el of model.elements) {
    const { d, y, barHeight, x1, barWidth, barOpacity, markerOpacity, value1X, value2X } = el;
    const center = y + barHeight / 2;
    const label = d.label;
    const diff = d.difference ?? d.value1 - d.value2;

    // gap bar
    ctx.save();
    ctx.globalAlpha = barOpacity;
    ctx.fillStyle = gapColors.get(label) || el.gapColor;
    roundRect(ctx, x1, center - 4, barWidth, 8, 4);
    ctx.fill();
    ctx.restore();

    // connecting line
    ctx.save();
    ctx.globalAlpha = markerOpacity;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.setLineDash(diff < 0 ? [4, 2] : []);
    ctx.beginPath();
    ctx.moveTo(x1, center);
    ctx.lineTo(el.x2, center);
    ctx.stroke();
    ctx.restore();

    // markers
    ctx.save();
    ctx.globalAlpha = markerOpacity;
    drawMarker(ctx, o.shapeValue1, value1X, center, v1Colors.get(label) || el.value1Color, o.squareRadius);
    drawMarker(ctx, o.shapeValue2, value2X, center, v2Colors.get(label) || el.value2Color, o.squareRadius);
    ctx.restore();
  }
}
