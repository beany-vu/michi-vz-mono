// EXPERIMENTAL opt-in WebGPU renderer for Treemap - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME TreemapRenderModel. Tiles are
// drawn as coloured TRIANGLES (two per rect) via the shared webgpu/marks.ts layer:
// the solid leaf fill, then (when split) a white veil rect over the untapped
// fraction. Parent container outlines and all text (labels, %, legend) stay on the
// SVG layer. Fill colours are resolved through the SAME light-DOM colour probe as
// canvas mode, so consumer CSS still reaches GPU pixels.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { emptyBatch, pushRect, markColor, drawMarksWebgpu } from "../webgpu/marks";
import type { TreemapRenderModel } from "./renderModel";

export interface TreemapWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

/**
 * Draw a TreemapRenderModel's tiles to `canvas` via WebGPU. Returns false when the
 * device/context is not (yet) available - the engine then paints the canvas-2D
 * fallback (which also draws the parent outlines + text) so the chart is never
 * blank, incl. jsdom where WebGPU is always unavailable.
 */
export function drawTreemapWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: TreemapRenderModel,
  o: TreemapWebgpuOptions,
): boolean {
  // Resolve fill colours through the SAME probe canvas mode uses (rect.tile, fill).
  const fallback = new Map<string, string>();
  for (const leaf of model.leaves)
    if (!fallback.has(leaf.colorKey)) fallback.set(leaf.colorKey, leaf.fill);
  const fillColors = resolveMarkColors(
    svg,
    model.groupKeys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("rect", "tile", "fill"),
    "fill",
  );

  const anyHighlight = model.highlightSet.size > 0;
  const veil = Math.max(0, Math.min(0.95, 1 - model.splitOpacity));

  const batch = emptyBatch();
  for (const d of model.leaves) {
    const highlighted =
      !anyHighlight || model.highlightSet.has(d.label) || model.highlightSet.has(d.colorKey);
    const groupOpacity = highlighted ? 1 : 0.2;
    const fill = fillColors.get(d.colorKey) || d.fill;

    pushRect(batch.triangles, d.x, d.y, d.w, d.h, markColor(fill, groupOpacity));
    if (model.showSplit && d.partialPct != null && d.realizedWidth < d.w) {
      pushRect(
        batch.triangles,
        d.x + d.realizedWidth,
        d.y,
        d.w - d.realizedWidth,
        d.h,
        markColor("#ffffff", groupOpacity * veil),
      );
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
