// Opt-in Canvas 2D renderer for ComparableHorizontalBar. Fill colour resolved via
// the SVG colour probe (resolveMarkColors `bar`/fill). jsdom → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { ComparableRenderModel } from "./renderModel";

export interface ComparableCanvasOptions {
  width: number;
  height: number;
  valueBasedOpacity: number;
  valueComparedOpacity: number;
}

export function drawComparableCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: ComparableRenderModel,
  o: ComparableCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const labels = model.bars.map((b) => b.label);
  const fallback = new Map(model.bars.map((b) => [b.label, b.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("rect", "bar", "fill"),
    "fill"
  );

  for (const bar of model.bars) {
    const color = fillColors.get(bar.label) || bar.color;
    const groupAlpha = bar.dimmed ? 0.3 : 1;
    ctx.fillStyle = color;
    for (const part of [
      { seg: bar.based, opacity: o.valueBasedOpacity },
      { seg: bar.compared, opacity: o.valueComparedOpacity },
    ]) {
      ctx.globalAlpha = groupAlpha * part.opacity;
      ctx.beginPath();
      ctx.rect(part.seg.x, bar.y, part.seg.width, bar.height);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
