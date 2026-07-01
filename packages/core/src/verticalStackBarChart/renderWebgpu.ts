// EXPERIMENTAL opt-in WebGPU renderer for VerticalStackBar — the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME StackRenderModel. Segments
// are drawn as filled RECTS via the shared marks.ts triangle pipeline. Fill colour
// is resolved through the SAME light-DOM colour probe as canvas mode, so consumer
// CSS still reaches GPU pixels. Text/axes/title/abbrev labels stay on the SVG layer.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { emptyBatch, pushRect, markColor, drawMarksWebgpu } from "../webgpu/marks";
import type { StackRenderModel } from "./renderModel";

export interface StackWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the async GPU device becomes ready, so the engine re-renders. */
  onReady?: () => void;
}

/**
 * Draw the stacked bar segments to `canvas` via WebGPU. Returns false when the
 * device/context is not (yet) available — the caller then paints its canvas-2D
 * fallback and, if a device is still resolving, re-renders on onReady to upgrade
 * to GPU.
 */
export function drawVerticalStackBarWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: StackRenderModel,
  o: StackWebgpuOptions
): boolean {
  // Resolve fill colours through the SAME probe canvas mode uses.
  const labels = model.keys;
  const fallback = new Map(model.keys.map((k) => [k, model.stackedRectData[k]?.[0]?.fill ?? "transparent"]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("rect", "bar", "fill"),
    "fill"
  );

  const hl = model.highlightSet;
  const anyHighlight = hl.size > 0;
  const batch = emptyBatch();
  for (const key of model.keys) {
    const rects = model.stackedRectData[key];
    if (!rects || rects.length === 0) continue;
    const fill = fillColors.get(key) || rects[0].fill;
    const opacity = anyHighlight && !hl.has(key) ? 0.2 : 1;
    const c = markColor(fill, opacity);
    for (const d of rects) {
      pushRect(batch.triangles, d.x, d.y, d.width, d.height, c);
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
