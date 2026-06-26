// Opt-in Canvas 2D renderer for RangeChart. Fills the band path strings (Path2D)
// + draws median lines; fill resolved via the SVG colour probe
// (resolveMarkColors `area`/fill). jsdom → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { RangeRenderModel } from "./renderModel";

export interface RangeCanvasOptions {
  width: number;
  height: number;
  fillOpacity: number;
}

export function drawRangeCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: RangeRenderModel,
  o: RangeCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const labels = model.series.map((s) => s.label);
  const fallback = new Map(model.series.map((s) => [s.label, s.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("path", "area", "fill"),
    "fill"
  );

  for (const s of model.series) {
    if (!s.areaPath) continue;
    const color = fillColors.get(s.label) || s.color;
    ctx.save();
    ctx.globalAlpha = s.dimmed ? 0.1 : o.fillOpacity;
    ctx.fillStyle = color;
    ctx.fill(new Path2D(s.areaPath));
    if (s.medianPath) {
      ctx.globalAlpha = s.dimmed ? 0.1 : 0.9;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke(new Path2D(s.medianPath));
    }
    ctx.restore();
  }
}
