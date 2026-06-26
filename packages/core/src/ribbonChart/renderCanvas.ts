// Opt-in Canvas 2D renderer for RibbonChart. Ribbons (Path2D) + column rects;
// fill resolved via the SVG colour probe (resolveMarkColors `bar`/fill). jsdom → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { RibbonRenderModel } from "./renderModel";

export interface RibbonCanvasOptions {
  width: number;
  height: number;
}

export function drawRibbonCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: RibbonRenderModel,
  o: RibbonCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const keys = [...new Set(model.columns.map((c) => c.key))];
  const fallback = new Map(model.columns.map((c) => [c.key, c.color]));
  const fillColors = resolveMarkColors(
    svg,
    keys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("rect", "bar", "fill"),
    "fill"
  );
  const colorOf = (key: string, fb: string): string => fillColors.get(key) || fb;

  for (const rb of model.ribbons) {
    ctx.globalAlpha = rb.dimmed ? 0.05 : 0.35;
    ctx.fillStyle = colorOf(rb.key, rb.color);
    ctx.fill(new Path2D(rb.path));
  }
  for (const col of model.columns) {
    ctx.globalAlpha = col.dimmed ? 0.15 : 1;
    ctx.fillStyle = colorOf(col.key, col.color);
    ctx.beginPath();
    ctx.rect(col.x, col.y, col.width, col.height);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
