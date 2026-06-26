// Opt-in Canvas 2D renderer for AreaChart. Fills the SAME stacked-area path
// strings the SVG renderer uses (Path2D, pixel space). Fill colours resolved via
// the SVG colour probe (resolveMarkColors with the `area`/fill contract) so
// consumer CSS reaches canvas pixels. jsdom → setupCanvas null → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { AreaRenderModel } from "./renderModel";

export interface AreaCanvasOptions {
  width: number;
  height: number;
}

export function drawAreaCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: AreaRenderModel,
  o: AreaCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const keys = model.series.map((s) => s.key);
  const fallback = new Map(model.series.map((s) => [s.key, s.fill]));
  const fillColors = resolveMarkColors(
    svg,
    keys,
    (k) => fallback.get(k) || "#fdfdfd",
    makeSimpleProbe("path", "area", "fill"),
    "fill"
  );

  for (const s of model.series) {
    if (!s.path) continue;
    ctx.save();
    ctx.globalAlpha = s.dimmed ? 0.05 : 1;
    const p = new Path2D(s.path);
    ctx.fillStyle = fillColors.get(s.key) || s.fill;
    ctx.fill(p);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#fff";
    ctx.stroke(p);
    ctx.restore();
  }
}
