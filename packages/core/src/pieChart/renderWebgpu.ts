// EXPERIMENTAL opt-in WebGPU renderer for Pie/donut - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME PieRenderModel. Each slice
// is tessellated into a triangle fan (pie) or an annulus band strip (donut) by
// sampling its arc into ring points, then handed to the shared GPU mark layer
// (webgpu/marks.ts). Text/axes/title/legend stay on the SVG layer; fill colours
// are resolved through the SAME light-DOM probe canvas mode uses, so consumer
// CSS still reaches GPU pixels. On-slice % labels are omitted in webgpu mode
// (text stays SVG-only); use renderer="canvas"/"svg" if slice labels are needed.
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { emptyBatch, pushFan, pushBandStrip, markColor, drawMarksWebgpu } from "../webgpu/marks";
import type { PieRenderModel } from "./renderModel";

export interface PieWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

// Angular resolution for sampling each slice's arc into a polyline ring. Slices
// span at most a full circle, so this bounds the worst-case segment count.
const RING_STEPS = 48;

/** Sample points along the arc [start,end) at the given radius, around (cx,cy). */
function sampleArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): Array<[number, number]> {
  const span = endAngle - startAngle;
  const steps = Math.max(1, Math.ceil((Math.abs(span) / (Math.PI * 2)) * RING_STEPS));
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (span * i) / steps;
    // Angles are clockwise from 12 o'clock (matches pieChart/geometry.ts).
    pts.push([cx + radius * Math.sin(a), cy - radius * Math.cos(a)]);
  }
  return pts;
}

export function drawPieWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: PieRenderModel,
  o: PieWebgpuOptions,
): boolean {
  const fallback = new Map<string, string>();
  for (const s of model.slices) if (!fallback.has(s.colorKey)) fallback.set(s.colorKey, s.fill);
  const fillColors = resolveMarkColors(
    svg,
    model.groupKeys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("path", "slice", "fill"),
    "fill",
  );

  const anyHighlight = model.highlightSet.size > 0;
  const batch = emptyBatch();

  for (const d of model.slices) {
    const highlighted = !anyHighlight || model.highlightSet.has(d.label);
    const css = fillColors.get(d.colorKey) || d.fill;
    const c = markColor(css, highlighted ? 1 : 0.2);

    const outerRing = sampleArc(model.cx, model.cy, model.radius, d.startAngle, d.endAngle);
    if (model.innerRadius > 0) {
      const innerRing = sampleArc(model.cx, model.cy, model.innerRadius, d.startAngle, d.endAngle);
      pushBandStrip(batch.triangles, outerRing, innerRing, c);
    } else {
      pushFan(batch.triangles, model.cx, model.cy, outerRing, c, false);
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
