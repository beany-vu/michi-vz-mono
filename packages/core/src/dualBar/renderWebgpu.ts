// EXPERIMENTAL opt-in WebGPU renderer for DualHorizontalBar — the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME DualRenderModel. Bars are
// drawn as GPU triangles via the shared marks.ts layer (pushRect per side). Fill
// resolved through the SAME light-DOM colour probe canvas mode uses, so consumer
// CSS still reaches GPU pixels. Text/axes/title stay on the SVG layer. Device
// acquisition is async; while the device is not ready this returns false and the
// engine paints the canvas-2D stopgap, then re-renders.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { drawMarksWebgpu, emptyBatch, pushRect, markColor } from "../webgpu/marks";
import type { DualRenderModel } from "./renderModel";

export interface DualWebgpuOptions {
  width: number;
  height: number;
  value1Opacity: number;
  value2Opacity: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

export function drawDualBarWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: DualRenderModel,
  o: DualWebgpuOptions
): boolean {
  // Resolve fill colours through the SAME nested probe canvas mode uses.
  const labels = model.bars.map((b) => b.label);
  const fallback = new Map(model.bars.map((b) => [b.label, b.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("rect", "bar", "fill"),
    "fill"
  );

  const batch = emptyBatch();
  for (const bar of model.bars) {
    const css = fillColors.get(bar.label) || bar.color;
    const groupAlpha = bar.dimmed ? 0.3 : 1;
    if (bar.bar1.width > 0) {
      pushRect(
        batch.triangles,
        bar.bar1.x,
        bar.y,
        bar.bar1.width,
        bar.height,
        markColor(css, groupAlpha * o.value1Opacity)
      );
    }
    if (bar.bar2.width > 0) {
      pushRect(
        batch.triangles,
        bar.bar2.x,
        bar.y,
        bar.bar2.width,
        bar.height,
        markColor(css, groupAlpha * o.value2Opacity)
      );
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
