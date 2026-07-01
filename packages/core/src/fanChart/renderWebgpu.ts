// EXPERIMENTAL opt-in WebGPU renderer for FanChart — the third sibling to
// renderSvg (inline in the engine) / renderCanvas.ts, consuming the SAME model:
// nested confidence bands (pixel-space top/bottom polylines) drawn as filled
// triangle strips (pushBandStrip), then the history/forecast median line drawn as
// stroked triangle quads (pushStroke) per run so the dash/solid split matches the
// SVG/canvas layers (dashed runs are approximated as solid on GPU — see fellBackFor
// notes in the engine). Colours resolve through the SAME light-DOM probes as canvas
// mode (makeSimpleProbe("path","area","fill") / ("path","line","stroke")), so
// consumer CSS still reaches GPU pixels. Text/axes/title stay on the SVG layer.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { emptyBatch, pushBandStrip, pushStroke, markColor, drawMarksWebgpu } from "../webgpu/marks";
import type { FanCanvasArgs } from "./renderCanvas";

export interface FanWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the async GPU device becomes ready, so the engine re-renders. */
  onReady?: () => void;
}

/**
 * Draw the fan chart's bands + median line via WebGPU. Returns false when the
 * device/context is not (yet) available — the caller then paints the canvas-2D
 * fallback (drawFanCanvas), same convention as scatter's drawScatterWebgpu.
 */
export function drawFanWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: FanCanvasArgs,
  o: FanWebgpuOptions
): boolean {
  // ----- Bands: probe the SAME ".area" fill contract as canvas mode -----
  const bandLabels = [...new Set(model.bands.map((b) => b.label))];
  const bandFallback = new Map(model.bands.map((b) => [b.label, b.color]));
  const fillColors = resolveMarkColors(
    svg,
    bandLabels,
    (l) => bandFallback.get(l) || "transparent",
    makeSimpleProbe("path", "area", "fill"),
    "fill"
  );

  // ----- Line: probe the SAME ".line" stroke contract as canvas mode -----
  const lineLabels = model.lineModel.series.map((s) => s.label);
  const lineFallback = new Map(model.lineModel.series.map((s) => [s.label, s.color]));
  const strokeColors = resolveMarkColors(
    svg,
    lineLabels,
    (l) => lineFallback.get(l) || "transparent",
    makeSimpleProbe("path", "line", "stroke"),
    "stroke"
  );

  const batch = emptyBatch();

  // Bands underneath, widest-first (already sorted by the engine).
  for (const b of model.bands) {
    if (!b.top || !b.bottom || b.top.length < 2) continue; // no pixel geometry to tessellate
    const css = fillColors.get(b.label) || b.color;
    pushBandStrip(batch.triangles, b.top, b.bottom, markColor(css, b.opacity));
  }

  // Line on top — one continuous stroked polyline per series (the model's already
  // pixel-projected `points`). Dash pattern (solid history / dashed forecast) is an
  // SVG/canvas-only affordance; GPU strokes are solid across the whole line — see
  // fellBackFor: the dashed forecast segment renders solid in webgpu mode.
  for (const s of model.lineModel.series) {
    if (s.points.length < 2) continue;
    const css = strokeColors.get(s.label) || s.color;
    const dim = s.dimmed ? 0.05 : 1;
    const c = markColor(css, dim);
    const pts: Array<[number, number]> = s.points.map((p) => [p.x, p.y]);
    pushStroke(batch.triangles, pts, 2.5, c);
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
