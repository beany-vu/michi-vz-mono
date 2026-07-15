// EXPERIMENTAL opt-in WebGPU renderer for BarBell - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME BarBellRenderModel. Bars are
// drawn as stroked polylines (pushStroke) and end-caps as instanced circles
// (pushCircle), via the shared chart-agnostic marks.ts layer. Fill colour is
// resolved through the SAME light-DOM colour probe as canvas mode, so consumer
// CSS still reaches GPU pixels. Text/axes/title stay on the SVG layer.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { emptyBatch, pushStroke, pushCircle, markColor, drawMarksWebgpu } from "../webgpu/marks";
import type { BarBellRenderModel } from "./renderModel";

export interface BarBellWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

export function drawBarBellWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: BarBellRenderModel,
  o: BarBellWebgpuOptions,
): boolean {
  // Resolve fill colours through the SAME probe canvas mode uses.
  const keys = [...new Set(model.segments.map((s) => s.key))];
  const fallback = new Map(model.segments.map((s) => [s.key, s.color]));
  const fillColors = resolveMarkColors(
    svg,
    keys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("rect", "bar", "fill"),
    "fill",
  );

  const batch = emptyBatch();
  // Pass 1: bars as stroked polylines. Pass 2: end-cap circles on top (mirrors
  // renderCanvas.ts's two-pass ordering so caps aren't hidden behind an adjacent bar).
  for (const seg of model.segments) {
    if (seg.width <= 0) continue;
    const css = fillColors.get(seg.key) || seg.color;
    const c = markColor(css, seg.dimmed ? 0.3 : 0.9);
    pushStroke(
      batch.triangles,
      [
        [seg.x, seg.cy],
        [seg.x + seg.width, seg.cy],
      ],
      model.barHeight,
      c,
    );
  }
  for (const seg of model.segments) {
    const css = fillColors.get(seg.key) || seg.color;
    const c = markColor(css, seg.dimmed ? 0.3 : 0.9);
    pushCircle(batch.circles, seg.cx, seg.capCy, model.capRadius, c);
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
