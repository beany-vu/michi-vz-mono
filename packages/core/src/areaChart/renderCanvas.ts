// Opt-in Canvas 2D renderer for AreaChart. Fills the SAME area path strings the
// SVG renderer uses (Path2D, pixel space). Fill colours resolved via the SVG colour
// probe (resolveMarkColors with the `area`/fill contract) so consumer CSS reaches
// canvas pixels. Stacked: opaque fills with a white seam. Overlapping
// (stacked:false): every fill at low alpha (largest first), then every top-edge
// line in the SAME resolved colour. jsdom → setupCanvas null → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import {
  AREA_DIMMED_OPACITY,
  AREA_OVERLAP_FILL_OPACITY,
  AREA_OVERLAP_LINE_WIDTH,
  type AreaRenderModel,
} from "./renderModel";

export interface AreaCanvasOptions {
  width: number;
  height: number;
  /** Progressive-draw reveal cutoff: only pixels at x <= revealX are painted
   *  (a ctx.clip rect, matching the SVG renderer's <clipPath> reveal). */
  revealX?: number;
}

/** Each key's mark colour as the browser resolves it for `path.area` (consumer CSS
 * included), falling back to the model's series colour. Shared by canvas, webgpu and
 * the svg overlap lines. */
export function resolveAreaColors(
  svg: SVGSVGElement | null,
  model: AreaRenderModel,
): Map<string, string> {
  const keys = model.series.map((s) => s.key);
  const fallback = new Map(model.series.map((s) => [s.key, s.fill]));
  return resolveMarkColors(
    svg,
    keys,
    (k) => fallback.get(k) || "#fdfdfd",
    makeSimpleProbe("path", "area", "fill"),
    "fill",
  );
}

export function drawAreaCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: AreaRenderModel,
  o: AreaCanvasOptions,
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  if (o.revealX !== undefined) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, Math.max(0, o.revealX), o.height);
    ctx.clip();
  }

  const fillColors = resolveAreaColors(svg, model);

  if (model.mode === "overlap") {
    for (const s of model.series) {
      if (!s.path) continue;
      ctx.save();
      ctx.globalAlpha = (s.dimmed ? AREA_DIMMED_OPACITY : 1) * AREA_OVERLAP_FILL_OPACITY;
      ctx.fillStyle = fillColors.get(s.key) || s.fill;
      ctx.fill(new Path2D(s.path));
      ctx.restore();
    }
    for (const s of model.series) {
      if (!s.linePath) continue;
      ctx.save();
      ctx.globalAlpha = s.dimmed ? AREA_DIMMED_OPACITY : 1;
      ctx.lineWidth = AREA_OVERLAP_LINE_WIDTH;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = fillColors.get(s.key) || s.fill;
      ctx.stroke(new Path2D(s.linePath));
      ctx.restore();
    }
  } else {
    for (const s of model.series) {
      if (!s.path) continue;
      ctx.save();
      ctx.globalAlpha = s.dimmed ? AREA_DIMMED_OPACITY : 1;
      const p = new Path2D(s.path);
      ctx.fillStyle = fillColors.get(s.key) || s.fill;
      ctx.fill(p);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#fff";
      ctx.stroke(p);
      ctx.restore();
    }
  }

  if (o.revealX !== undefined) ctx.restore();
}
