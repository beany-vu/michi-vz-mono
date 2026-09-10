// EXPERIMENTAL opt-in WebGPU renderer for Gauge - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME GaugeRenderModel. Each ring
// (track + value arc) is tessellated into an annulus band strip by sampling its
// arc into ring points, then handed to the shared GPU mark layer
// (webgpu/marks.ts). The centre label stays on the HTML/SVG layer; arc colours
// are resolved through the SAME light-DOM probe canvas mode uses, so consumer
// CSS still reaches GPU pixels. Rounded caps are approximated as butt caps.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { emptyBatch, pushBandStrip, markColor, drawMarksWebgpu } from "../webgpu/marks";
import { cssColorToPremultiplied, type RGBA } from "../webgpu/color";
import type { GaugeRenderModel } from "./renderModel";

export interface GaugeWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

const RING_STEPS = 64;

/** Sample points along the arc [start, start+sweep] at the given radius, around
 *  (cx,cy). Angles are clockwise from 12 o'clock (the pie convention). */
function sampleArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  sweep: number,
): Array<[number, number]> {
  const steps = Math.max(1, Math.ceil((Math.abs(sweep) / (Math.PI * 2)) * RING_STEPS));
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (sweep * i) / steps;
    pts.push([cx + radius * Math.sin(a), cy - radius * Math.cos(a)]);
  }
  return pts;
}

/** Linearly interpolate premultiplied RGBA between evenly-spaced gradient
 *  stops at t in [0,1], then apply an opacity multiplier (stays premultiplied). */
function gradientColorAt(stops: RGBA[], t: number, opacity: number): RGBA {
  const clamped = Math.min(1, Math.max(0, t));
  const n = stops.length;
  if (n === 1) {
    const [r, g, b, a] = stops[0];
    return [r * opacity, g * opacity, b * opacity, a * opacity];
  }
  const scaled = clamped * (n - 1);
  const i = Math.min(n - 2, Math.floor(scaled));
  const f = scaled - i;
  const a0 = stops[i];
  const a1 = stops[i + 1];
  const r = a0[0] + (a1[0] - a0[0]) * f;
  const g = a0[1] + (a1[1] - a0[1]) * f;
  const b = a0[2] + (a1[2] - a0[2]) * f;
  const a = a0[3] + (a1[3] - a0[3]) * f;
  return [r * opacity, g * opacity, b * opacity, a * opacity];
}

export function drawGaugeWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: GaugeRenderModel,
  o: GaugeWebgpuOptions,
): boolean {
  const fallback = new Map<string, string>();
  for (const r of model.rings) if (!fallback.has(r.colorKey)) fallback.set(r.colorKey, r.stroke);
  const strokeColors = resolveMarkColors(
    svg,
    model.groupKeys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("path", "gauge-arc", "stroke"),
    "stroke",
  );

  const batch = emptyBatch();

  for (const d of model.rings) {
    const rOuter = d.radius + d.thickness / 2;
    const rInner = Math.max(0, d.radius - d.thickness / 2);

    // Track: tessellate only the swept band, not the full annulus - it spans
    // the same sweep as the arc.
    const trackOuter = sampleArc(model.cx, model.cy, rOuter, d.startAngle, model.sweepAngle);
    const trackInner = sampleArc(model.cx, model.cy, rInner, d.startAngle, model.sweepAngle);
    pushBandStrip(batch.triangles, trackOuter, trackInner, markColor(d.trackColor, d.trackOpacity));

    // Value arc: partial annulus band. d.sweep is already scaled against the
    // gauge's sweepAngle (not the full circle).
    if (d.sweep > 0) {
      const arcOuter = sampleArc(model.cx, model.cy, rOuter, d.startAngle, d.sweep);
      const arcInner = sampleArc(model.cx, model.cy, rInner, d.startAngle, d.sweep);
      const colours = d.gradient;
      if (colours && colours.length > 1) {
        // Anchored to the FULL sweep (fixed x extent across the ring's
        // diameter), never to the drawn portion - matches the SVG/canvas
        // renderers' fixed x1/x2 gradient. Interpolated per band segment
        // (piecewise-linear approximation of the linear gradient).
        const stops = colours.map((c) => cssColorToPremultiplied(c));
        const x0 = model.cx - d.radius;
        const x1 = model.cx + d.radius;
        const span = x1 - x0 || 1;
        for (let i = 0; i < arcOuter.length - 1; i++) {
          const segOuter = [arcOuter[i], arcOuter[i + 1]];
          const segInner = [arcInner[i], arcInner[i + 1]];
          const midX = (arcOuter[i][0] + arcOuter[i + 1][0]) / 2;
          const t = (midX - x0) / span;
          pushBandStrip(batch.triangles, segOuter, segInner, gradientColorAt(stops, t, d.opacity));
        }
      } else {
        const css =
          colours && colours.length === 1 ? colours[0] : strokeColors.get(d.colorKey) || d.stroke;
        pushBandStrip(batch.triangles, arcOuter, arcInner, markColor(css, d.opacity));
      }
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
