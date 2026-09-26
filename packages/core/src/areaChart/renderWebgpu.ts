// EXPERIMENTAL opt-in WebGPU renderer for AreaChart - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME AreaRenderModel (plus the
// scales used to build it, since the shared marks layer needs pixel-space
// polylines rather than the SVG path string canvas mode fills via Path2D). Each
// series becomes a filled BAND (top polyline vs. baseline/bottom polyline) plus a
// top-edge STROKE, reduced to the chart-agnostic MarkBatch and drawn via
// webgpu/marks.ts. Stacked: opaque band + thin white seam. Overlapping
// (stacked:false): every band at low alpha (largest first), then every top stroke
// in the series colour. Fill colours are resolved through the SAME light-DOM probe
// canvas mode uses, so consumer CSS still reaches GPU pixels. Curve interpolation
// (curveMonotoneX/curveBumpX) is not expressed on the GPU band - segments are
// straight, matching curveLinear; use renderer="canvas"/"svg" for exact curved
// shapes. Device acquisition is async; while not ready this returns false and the
// engine paints the canvas-2D stopgap, then re-renders on onReady.
import { drawMarksWebgpu, emptyBatch, pushBandStrip, pushStroke, markColor } from "../webgpu/marks";
import type { MarkBatch } from "../webgpu/marks";
import { areaProjectX } from "./geometry";
import { resolveAreaColors } from "./renderCanvas";
import {
  AREA_DIMMED_OPACITY,
  AREA_OVERLAP_FILL_OPACITY,
  AREA_OVERLAP_LINE_WIDTH,
  type AreaRenderModel,
} from "./renderModel";
import type { AreaScales } from "./scales";
import type { XaxisDataType } from "../types";

export interface AreaWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

/** Pure: the triangle batch for one frame, given each key's resolved colour. */
export function buildAreaMarkBatch(
  model: AreaRenderModel,
  fillColors: Map<string, string>,
  scales: AreaScales,
  xAxisDataType: XaxisDataType,
): MarkBatch {
  const overlap = model.mode === "overlap";
  const batch = emptyBatch();
  // Overlapping strokes go on after EVERY band, so each top edge stays crisp.
  const strokes: Array<{ top: Array<[number, number]>; css: string; opacity: number }> = [];
  for (const s of model.series) {
    if (s.values.length === 0) continue;
    const top: Array<[number, number]> = [];
    const bottom: Array<[number, number]> = [];
    for (const v of s.values) {
      const x = areaProjectX(v.data, scales.xScale, xAxisDataType);
      top.push([x, scales.yScale(v[1] || 0)]);
      bottom.push([x, scales.yScale(v[0] || 0)]);
    }

    const css = fillColors.get(s.key) || s.fill;
    const opacity = s.dimmed ? AREA_DIMMED_OPACITY : 1;
    if (overlap) {
      pushBandStrip(
        batch.triangles,
        top,
        bottom,
        markColor(css, opacity * AREA_OVERLAP_FILL_OPACITY),
      );
      strokes.push({ top, css, opacity });
    } else {
      pushBandStrip(batch.triangles, top, bottom, markColor(css, opacity));
      // Thin top border, matching the SVG/canvas 1px white stroke.
      pushStroke(batch.triangles, top, 1, markColor("#fff", opacity));
    }
  }
  for (const st of strokes) {
    pushStroke(batch.triangles, st.top, AREA_OVERLAP_LINE_WIDTH, markColor(st.css, st.opacity));
  }
  return batch;
}

/**
 * false → device/context not ready (incl. jsdom); the engine should paint the
 * canvas fallback.
 */
export function drawAreaWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: AreaRenderModel,
  scales: AreaScales,
  xAxisDataType: XaxisDataType,
  o: AreaWebgpuOptions,
): boolean {
  const batch = buildAreaMarkBatch(model, resolveAreaColors(svg, model), scales, xAxisDataType);
  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
