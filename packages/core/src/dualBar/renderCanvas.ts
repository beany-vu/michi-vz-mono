// Opt-in Canvas 2D renderer for DualHorizontalBar. Fill resolved via the SVG
// colour probe (resolveMarkColors `bar`/fill). jsdom → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { DualRenderModel } from "./renderModel";

export interface DualCanvasOptions {
  width: number;
  height: number;
  value1Opacity: number;
  value2Opacity: number;
}

export function drawDualCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: DualRenderModel,
  o: DualCanvasOptions
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
      { seg: bar.bar1, opacity: o.value1Opacity },
      { seg: bar.bar2, opacity: o.value2Opacity },
    ]) {
      ctx.globalAlpha = groupAlpha * part.opacity;
      ctx.beginPath();
      ctx.rect(part.seg.x, bar.y, part.seg.width, bar.height);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
