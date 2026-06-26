// Opt-in Canvas 2D renderer for VerticalStackBar. Paints the same rects the SVG
// renderer does (no DOM); fill colours resolved via the SVG colour probe
// (resolveMarkColors `bar`/fill) so consumer CSS reaches canvas pixels. The
// hasOwnProperty guard already ran in stack.ts — the model is authoritative, so
// this loop only soft-skips empty key arrays (no second guard). jsdom → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { StackRenderModel } from "./renderModel";

export interface StackCanvasOptions {
  width: number;
  height: number;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.rect(x, y, w, h);
}

export function drawStackCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: StackRenderModel,
  o: StackCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const labels = model.keys;
  const fallback = new Map(model.keys.map((k) => [k, model.stackedRectData[k]?.[0]?.fill ?? "transparent"]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("rect", "bar", "fill"),
    "fill"
  );

  const anyHighlight = model.highlightSet.size > 0;
  for (const key of model.keys) {
    const rects = model.stackedRectData[key];
    if (!rects || rects.length === 0) continue;
    const fill = fillColors.get(key) || rects[0].fill;
    ctx.globalAlpha = anyHighlight && !model.highlightSet.has(key) ? 0.2 : 1;
    ctx.fillStyle = fill;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    for (const d of rects) {
      roundRect(ctx, d.x, d.y, d.width, d.height, 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Series abbreviation labels (width>=20 already enforced in the model).
  ctx.fillStyle = "#000";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  for (const lbl of model.abbrevLabels) ctx.fillText(lbl.text, lbl.x, lbl.y);
}
