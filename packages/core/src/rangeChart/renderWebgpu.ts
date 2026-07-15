// EXPERIMENTAL opt-in WebGPU renderer for RangeChart - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME RangeRenderModel. Each band
// is drawn as a filled TRIANGLE strip between the valueMax (top) and valueMin
// (bottom) polylines (pushBandStrip), with the median drawn as a stroked polyline
// (pushStroke) on top. Fill/stroke colour is resolved through the SAME light-DOM
// colour probe as canvas mode, so consumer CSS still reaches GPU pixels.
//
// The render model only carries SVG path strings (curve-interpolated by d3), so
// each series' area/median `d` is flattened back into polylines by sampling an
// offscreen <path> via getPointAtLength - the exact same geometry the SVG/canvas
// renderers paint, just tessellated for the GPU. (jsdom does not implement
// getPointAtLength, but that is moot: this only runs once a real GPU device has
// been acquired, which never happens in jsdom - the engine falls back to canvas
// first.)
import { svgEl } from "../dom";
import { emptyBatch, pushBandStrip, pushStroke, markColor, drawMarksWebgpu } from "../webgpu/marks";
import type { MarkBatch } from "../webgpu/marks";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { RangeRenderModel } from "./renderModel";

export interface RangeWebgpuOptions {
  width: number;
  height: number;
  fillOpacity: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

// d3 area() emits: M <top...> L <bottom...reversed> Z - the top ring runs forward
// through the points and the bottom ring runs backward, closing the band. Sampling
// the full closed path and splitting it at its midpoint recovers both polylines in
// the SAME point order the SVG/canvas renderers draw (curve included).
function flattenAreaPath(
  d: string,
  samplesPerHalf = 24,
): { top: Array<[number, number]>; bottom: Array<[number, number]> } | null {
  if (!d) return null;
  const path = svgEl("path", { d }) as SVGPathElement;
  if (typeof path.getTotalLength !== "function") return null;
  let len: number;
  try {
    len = path.getTotalLength();
  } catch {
    return null;
  }
  if (!Number.isFinite(len) || len <= 0) return null;

  const half = Math.floor(len / 2);
  const top: Array<[number, number]> = [];
  const bottom: Array<[number, number]> = [];
  for (let i = 0; i <= samplesPerHalf; i++) {
    const t = path.getPointAtLength((half * i) / samplesPerHalf);
    top.push([t.x, t.y]);
  }
  for (let i = 0; i <= samplesPerHalf; i++) {
    const b = path.getPointAtLength(len - (half * i) / samplesPerHalf);
    bottom.push([b.x, b.y]);
  }
  return { top, bottom };
}

function flattenLinePath(d: string, samples = 48): Array<[number, number]> | null {
  if (!d) return null;
  const path = svgEl("path", { d }) as SVGPathElement;
  if (typeof path.getTotalLength !== "function") return null;
  let len: number;
  try {
    len = path.getTotalLength();
  } catch {
    return null;
  }
  if (!Number.isFinite(len) || len <= 0) return null;

  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= samples; i++) {
    const p = path.getPointAtLength((len * i) / samples);
    pts.push([p.x, p.y]);
  }
  return pts;
}

export function drawRangeWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: RangeRenderModel,
  o: RangeWebgpuOptions,
): boolean {
  // Resolve fill colours through the SAME probe canvas mode uses (path.area, fill).
  const labels = model.series.map((s) => s.label);
  const fallback = new Map(model.series.map((s) => [s.label, s.color]));
  const fillColors = resolveMarkColors(
    svg,
    labels,
    (l) => fallback.get(l) || "transparent",
    makeSimpleProbe("path", "area", "fill"),
    "fill",
  );

  const batch: MarkBatch = emptyBatch();
  for (const s of model.series) {
    if (!s.areaPath) continue;
    const css = fillColors.get(s.label) || s.color;
    const bandOpacity = s.dimmed ? 0.1 : o.fillOpacity;
    const bandColor = markColor(css, bandOpacity);
    const flat = flattenAreaPath(s.areaPath);
    if (flat) {
      pushBandStrip(batch.triangles, flat.top, flat.bottom, bandColor);
    }

    if (s.medianPath) {
      const strokeOpacity = s.dimmed ? 0.1 : 0.9;
      const strokeColor = markColor(css, strokeOpacity);
      const pts = flattenLinePath(s.medianPath);
      if (pts) {
        pushStroke(batch.triangles, pts, 1.5, strokeColor);
      }
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
