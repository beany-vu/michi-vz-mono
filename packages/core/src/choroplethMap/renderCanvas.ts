// Opt-in Canvas 2D renderer for ChoroplethMap. Each region is a SINGLE mark (no
// sub-marks like ComparableBar's based/compared pair), so a plain single-element
// colour probe (makeSimpleProbe) is enough - no dual-form/descendant probe needed
// (see canvas/resolveMarkColors.ts's makeSubBarProbe for the contrast). Draws via
// geoPath(projection, ctx): d3-geo renders natively (and efficiently) straight to
// a Canvas 2D context, so this renderer does NOT re-parse the SVG `d` string or
// reimplement path math - it walks the raw GeoJSON geometry per feature.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { createChoroplethPathGenerator } from "./scales";
import type { ChoroplethMapRenderModel } from "./renderModel";

export interface ChoroplethCanvasOptions {
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
}

const isTransparent = (c: string): boolean =>
  c === "transparent" || c === "rgba(0, 0, 0, 0)" || c === "rgba(0,0,0,0)";

export function drawChoroplethMapCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: ChoroplethMapRenderModel,
  o: ChoroplethCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const labels = model.features.map((f) => f.id);
  const fallback = new Map(model.features.map((f) => [f.id, f.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("path", "region", "fill"),
    "fill"
  );

  const pathGen = createChoroplethPathGenerator(model.projection, ctx);

  for (const mark of model.features) {
    if (!mark.geometry) continue;
    const color = fillColors.get(mark.id) || mark.color;
    if (isTransparent(color)) continue;

    ctx.globalAlpha = mark.dimmed ? 0.3 : 1;
    ctx.beginPath();
    pathGen({ type: "Feature", properties: {}, geometry: mark.geometry });
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = o.strokeColor;
    ctx.lineWidth = o.strokeWidth;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
