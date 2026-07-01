// EXPERIMENTAL opt-in WebGPU renderer for BubbleChart - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME BubbleRenderModel and the
// SHARED gpu mark layer (webgpu/marks.ts). Every bubble reduces to instanced
// CIRCLES: the base disc, and - when split is on - a white veil disc plus the
// solid realized-core disc drawn on top (mirrors renderCanvas.ts's `disc` calls).
// Fill colours are resolved through the SAME light-DOM probe as canvas mode, so
// consumer CSS still reaches GPU pixels. Labels stay off the GPU layer (text is an
// SVG/canvas-only concern here, same PoC scope as scatter's shape approximation).
import { emptyBatch, pushCircle, markColor, drawMarksWebgpu } from "../webgpu/marks";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { BubbleRenderModel } from "./renderModel";

export interface BubbleWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

export function drawBubbleWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: BubbleRenderModel,
  o: BubbleWebgpuOptions
): boolean {
  // Resolve fill colours through the SAME probe canvas mode uses.
  const fallback = new Map<string, string>();
  for (const b of model.bubbles) if (!fallback.has(b.colorKey)) fallback.set(b.colorKey, b.fill);
  const fillColors = resolveMarkColors(
    svg,
    model.groupKeys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("circle", "bubble", "fill"),
    "fill"
  );

  const anyHighlight = model.highlightSet.size > 0;
  const veilOpacity = Math.max(0, Math.min(0.95, 1 - model.splitOpacity));

  const batch = emptyBatch();
  for (const d of model.bubbles) {
    const highlighted = !anyHighlight || model.highlightSet.has(d.label);
    const groupOpacity = highlighted ? 1 : 0.2;
    const fill = fillColors.get(d.colorKey) || d.fill;
    const fillC = markColor(fill, groupOpacity);

    pushCircle(batch.circles, d.x, d.y, d.r, fillC);

    if (model.showSplit && d.partialPct != null && d.realizedRadius < d.r) {
      const veilC = markColor("#ffffff", groupOpacity * veilOpacity);
      pushCircle(batch.circles, d.x, d.y, d.r, veilC);
      pushCircle(batch.circles, d.x, d.y, d.realizedRadius, fillC);
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
