// EXPERIMENTAL opt-in WebGPU renderer for RadarChart - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME RadarRenderModel. Each
// series polygon becomes a triangle FAN (fill) + a stroked outline; the polar
// grid (rings/spokes/axis labels) stays on the SVG layer. Colours are resolved
// through the SAME probe canvas mode uses, so consumer CSS still reaches GPU
// pixels. Built on the shared chart-agnostic mark layer (webgpu/marks.ts) - this
// file only builds a MarkBatch and hands it off, it does not own a GPU pipeline.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { emptyBatch, pushFan, pushStroke, markColor, drawMarksWebgpu } from "../webgpu/marks";
import type { RadarRenderModel } from "./renderModel";

export interface RadarWebgpuOptions {
  width: number;
  height: number;
  fillOpacity: number;
  /** Fill dimmed polygons as a soft background (default true), mirrors renderCanvas. */
  dimmedFill?: boolean;
  /** Called once when the async GPU device becomes ready, so the engine re-renders. */
  onReady?: () => void;
}

/**
 * Draw the radar series polygons (fill + outline) via WebGPU. Returns false when
 * the device/context is not (yet) available - the caller then paints its
 * canvas-2D fallback (drawRadarCanvas), incl. jsdom where WebGPU is never present.
 * Pole dots and the polar grid are NOT drawn here (grid stays SVG; dots would need
 * an extra instanced-circle pass - omitted for this pass, see fellBackFor).
 */
export function drawRadarWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: RadarRenderModel,
  o: RadarWebgpuOptions
): boolean {
  // Resolve colours through the SAME probe as canvas mode (stroke, falling
  // through to fill) - see radarChart/renderCanvas.ts.
  const labels = model.series.map((s) => s.label);
  const fallback = new Map(model.series.map((s) => [s.label, s.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("polygon", "radar-area", "stroke"),
    ["stroke", "fill"]
  );

  const batch = emptyBatch();
  for (const s of model.series) {
    const css = fillColors.get(s.label) || s.color;
    if (s.poles.length < 2) continue;
    const ring: Array<[number, number]> = s.poles.map((p) => [p.x, p.y]);

    // Fill: matches canvas's `ctx.globalAlpha = dimmed ? (dimmedFill===false?0:0.12) : fillOpacity`.
    const fillAlpha = s.dimmed ? (o.dimmedFill === false ? 0 : 0.12) : o.fillOpacity;
    if (fillAlpha > 0) {
      pushFan(batch.triangles, model.grid.cx, model.grid.cy, ring, markColor(css, fillAlpha));
    }

    // Stroke: matches canvas's dimmed=2px/active=3px outline, alpha 0.3/1.
    const strokeAlpha = s.dimmed ? 0.3 : 1;
    const strokeWidth = s.dimmed ? 2 : 3;
    const closedRing = [...ring, ring[0]];
    pushStroke(batch.triangles, closedRing, strokeWidth, markColor(css, strokeAlpha));
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
