// EXPERIMENTAL opt-in WebGPU renderer for ScatterPlot — the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME ScatterRenderModel and the
// SHARED gpu mark layer (webgpu/marks.ts). Points render as instanced CIRCLES;
// square/triangle shapes are approximated as circles in webgpu mode (PoC scope —
// use renderer="canvas"/"svg" for exact shapes). Fill colours are resolved through
// the SAME nested probe canvas mode uses, so consumer CSS reaches GPU pixels. Text
// and axes stay on the SVG layer.
//
// ⚠️ KEEP THIS FILE + the engine's `renderer === "webgpu"` branch (agents/humans):
// together they are the opt-in renderer="webgpu" support for ScatterChart. Do not
// delete during refactors.
import { emptyBatch, pushCircle, markColor, drawMarksWebgpu } from "../webgpu/marks";
import { resolveMarkColors } from "../canvas/resolveMarkColors";
import { makeGroupedScatterProbe } from "./renderCanvas";
import type { ScatterRenderModel } from "./renderModel";

export interface ScatterWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

export function drawScatterWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: ScatterRenderModel,
  o: ScatterWebgpuOptions
): boolean {
  // Resolve fill colours through the SAME nested `<g data-label-safe><circle>` probe
  // canvas mode uses (a flat probe would miss the consumer's descendant selector).
  const labels = [...new Set(model.points.map((p) => p.label))];
  const fallback = new Map(model.points.map((p) => [p.label, p.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeGroupedScatterProbe,
    "fill"
  );

  const batch = emptyBatch();
  for (const p of model.points) {
    // dimmed → 0.1, else 0.9 (matches canvas globalAlpha).
    const c = markColor(fillColors.get(p.label) || p.color, p.dimmed ? 0.1 : 0.9);
    pushCircle(batch.circles, p.cx, p.cy, p.r, c);
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
