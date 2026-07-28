// EXPERIMENTAL opt-in WebGPU renderer for Gauge - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME GaugeRenderModel. Each ring
// (track + value arc) is tessellated into an annulus band strip by sampling its
// arc into ring points, then handed to the shared GPU mark layer
// (webgpu/marks.ts). The centre label stays on the HTML/SVG layer; arc colours
// are resolved through the SAME light-DOM probe canvas mode uses, so consumer
// CSS still reaches GPU pixels. Rounded caps are approximated as butt caps.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { emptyBatch, pushBandStrip, markColor, drawMarksWebgpu } from "../webgpu/marks";
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

  const TAU = Math.PI * 2;
  const batch = emptyBatch();

  for (const d of model.rings) {
    const rOuter = d.radius + d.thickness / 2;
    const rInner = Math.max(0, d.radius - d.thickness / 2);

    // Track: full annulus.
    const trackOuter = sampleArc(model.cx, model.cy, rOuter, 0, TAU);
    const trackInner = sampleArc(model.cx, model.cy, rInner, 0, TAU);
    pushBandStrip(batch.triangles, trackOuter, trackInner, markColor(d.trackColor, d.trackOpacity));

    // Value arc: partial annulus band.
    if (d.sweep > 0) {
      const css = strokeColors.get(d.colorKey) || d.stroke;
      const arcOuter = sampleArc(model.cx, model.cy, rOuter, d.startAngle, d.sweep);
      const arcInner = sampleArc(model.cx, model.cy, rInner, d.startAngle, d.sweep);
      pushBandStrip(batch.triangles, arcOuter, arcInner, markColor(css, d.opacity));
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
