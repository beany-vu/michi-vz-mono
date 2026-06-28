// Opt-in Canvas 2D renderer for Pie/donut. Paints the same slices the SVG renderer
// does (no DOM); fill colours resolved via the SVG colour probe (class `slice`,
// fill) so consumer CSS reaches canvas pixels. The context is translated to
// (cx,cy) to match the origin-based arc paths. jsdom has no 2D context → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { readableTextColor } from "../math/contrast";
import type { PieRenderModel } from "./renderModel";

export interface PieCanvasOptions {
  width: number;
  height: number;
}

const LABEL_MIN_ANGLE = 0.28;

export function drawPieCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: PieRenderModel,
  o: PieCanvasOptions
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const fallback = new Map<string, string>();
  for (const s of model.slices) if (!fallback.has(s.colorKey)) fallback.set(s.colorKey, s.fill);
  const fillColors = resolveMarkColors(
    svg,
    model.groupKeys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("path", "slice", "fill"),
    "fill"
  );

  const anyHighlight = model.highlightSet.size > 0;
  const cs =
    svg && typeof window !== "undefined" && window.getComputedStyle
      ? window.getComputedStyle(svg)
      : null;
  const fam = (cs && cs.fontFamily) || "sans-serif";
  const fs = (cs && parseFloat(cs.getPropertyValue("--michi-vz-font-size"))) || 12;

  ctx.save();
  ctx.translate(model.cx, model.cy);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const d of model.slices) {
    const highlighted = !anyHighlight || model.highlightSet.has(d.label);
    const fill = fillColors.get(d.colorKey) || d.fill;

    ctx.globalAlpha = highlighted ? 1 : 0.2;
    ctx.fillStyle = fill;
    ctx.fill(new Path2D(d.d));

    if (model.showLabels && d.endAngle - d.startAngle >= LABEL_MIN_ANGLE && model.radius >= 40) {
      ctx.fillStyle = readableTextColor(fill);
      ctx.font = `${Math.round(fs)}px ${fam}`;
      ctx.fillText(d.pctText, d.labelX, d.labelY);
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
