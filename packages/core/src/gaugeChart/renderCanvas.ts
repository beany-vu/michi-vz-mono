// Opt-in Canvas 2D renderer for Gauge. Paints the same rings the SVG renderer
// does (no DOM); arc stroke colours resolved via the SVG colour probe (class
// `gauge-arc`, stroke) so consumer CSS reaches canvas pixels. jsdom has no 2D
// context → no-op.
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { GaugeRenderModel } from "./renderModel";

export interface GaugeCanvasOptions {
  width: number;
  height: number;
}

const TOP = -Math.PI / 2; // canvas angle of 12 o'clock

export function drawGaugeCanvas(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: GaugeRenderModel,
  o: GaugeCanvasOptions,
): void {
  const setup = setupCanvas(canvas, o.width, o.height);
  if (!setup) return;
  const { ctx } = setup;

  const fallback = new Map<string, string>();
  for (const r of model.rings) if (!fallback.has(r.colorKey)) fallback.set(r.colorKey, r.stroke);
  const strokeColors = resolveMarkColors(
    svg,
    model.groupKeys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("path", "gauge-arc", "stroke"),
    "stroke",
  );

  ctx.lineCap = model.roundedCaps ? "round" : "butt";

  for (const d of model.rings) {
    ctx.lineWidth = d.thickness;
    const start = TOP + d.startAngle;

    // Track: spans the same sweep as the arc, not a full circle.
    ctx.globalAlpha = d.trackOpacity;
    ctx.strokeStyle = d.trackColor;
    ctx.beginPath();
    ctx.arc(model.cx, model.cy, d.radius, start, start + model.sweepAngle);
    ctx.stroke();

    // Value arc: sweep clockwise from 12 o'clock (+ startAngle). d.sweep is
    // already scaled against the gauge's sweepAngle (not the full circle).
    if (d.sweep > 0) {
      ctx.globalAlpha = d.opacity;
      const colours = d.gradient;
      if (colours && colours.length === 1) {
        ctx.strokeStyle = colours[0];
      } else if (colours && colours.length > 1) {
        // Anchored to the FULL sweep (fixed across the ring's diameter), never
        // to the drawn portion - matches the SVG renderer's userSpaceOnUse gradient.
        const grad = ctx.createLinearGradient(
          model.cx - d.radius,
          model.cy,
          model.cx + d.radius,
          model.cy,
        );
        colours.forEach((c, i) => grad.addColorStop(i / (colours.length - 1), c));
        ctx.strokeStyle = grad;
      } else {
        ctx.strokeStyle = strokeColors.get(d.colorKey) || d.stroke;
      }
      ctx.beginPath();
      ctx.arc(model.cx, model.cy, d.radius, start, start + d.sweep);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}
