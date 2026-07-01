// EXPERIMENTAL opt-in WebGPU renderer for LineChart - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME LineRenderModel. Each
// series run is tessellated into a constant-width stroke quad-strip via the
// shared marks.ts pushStroke() helper (no per-run dash support on GPU - every
// run draws solid; use renderer="canvas"/"svg" for exact dashed "uncertain"
// runs). Single-point guide lines are drawn as a thin pushRect() bar. Text/axes/
// title/data-point-marker shapes stay off this PoC path - use canvas/svg when
// showDataPoints is needed. Colours are resolved through the SAME light-DOM
// probe canvas mode uses, so consumer CSS still reaches GPU pixels.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { emptyBatch, pushStroke, pushRect, markColor, drawMarksWebgpu } from "../webgpu/marks";
import type { LineRenderModel } from "./renderModel";

export interface LineWebgpuOptions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  singlePointLine: { stroke?: string; strokeWidth?: number } | null;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

const STROKE_WIDTH = 2.5;

/**
 * Draw the line chart's polylines (+ single-point guide lines) via WebGPU.
 * Returns false when the device/context is not (yet) available - the caller
 * then paints its canvas-2D fallback (incl. jsdom, where this always no-ops).
 */
export function drawLineWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: LineRenderModel,
  o: LineWebgpuOptions
): boolean {
  const labels = model.series.map((s) => s.label);
  const fallback = new Map(model.series.map((s) => [s.label, s.color]));
  const strokeColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("path", "line", "stroke"),
    "stroke"
  );

  const batch = emptyBatch();
  for (const s of model.series) {
    const css = strokeColors.get(s.label) || s.color;
    const dim = s.dimmed ? 0.05 : 1;
    const c = markColor(css, dim);
    if (c[3] <= 0) continue;

    // Slice the series' pixel-projected points back into per-run polylines
    // (runs and points iterate the same source series in the same order, so a
    // running cursor recovers each run's pixel points without re-projecting).
    let cursor = 0;
    for (const run of s.runs) {
      const n = run.points.length;
      const runPts = s.points.slice(cursor, cursor + n).map((p): [number, number] => [p.x, p.y]);
      cursor += n - (n > 1 ? 1 : 0); // adjacent runs share their boundary point
      if (runPts.length < 2) continue;
      pushStroke(batch.triangles, runPts, STROKE_WIDTH, c);
    }

    if (s.singlePointY !== null && o.singlePointLine) {
      const cfg = o.singlePointLine;
      const lineColor = cfg.stroke ? markColor(cfg.stroke, dim) : c;
      const w = cfg.strokeWidth ?? STROKE_WIDTH;
      const x1 = o.margin.left;
      const x2 = o.width - o.margin.right;
      pushRect(batch.triangles, x1, s.singlePointY - w / 2, x2 - x1, w, lineColor);
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
