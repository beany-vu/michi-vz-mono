// WebGPU renderer for ChoroplethMap - DELEGATED, not a native GPU tessellator,
// and NOT a do-nothing stub. Every other chart's renderWebgpu.ts tessellates its
// render model into GPU triangles via the shared webgpu/marks.ts helpers
// (pushRect/pushFan/pushBandStrip/pushStroke - see e.g. fanChart/renderWebgpu.ts
// composing pushBandStrip + pushStroke). That approach assumes shapes simple
// enough for those primitives: axis-aligned rects, convex fans, ruled bands.
// ChoroplethMap's regions are arbitrary GeoJSON polygons - frequently CONCAVE,
// sometimes multi-ring with holes (islands, enclaves). `pushFan` only
// triangulates correctly from a convex (or star-shaped-about-that-vertex)
// boundary; fanning a concave country outline from one vertex paints triangles
// outside the border. Correct GPU tessellation of arbitrary simple polygons
// needs real ear-clipping / monotone decomposition - disproportionate scope for
// this first geo chart, and d3-geo's geoPath ALREADY renders natively and
// efficiently straight to a 2D canvas context; a choropleth is typically
// dozens-to-low-hundreds of paths, not the bar/point cloud scale where GPU
// batching earns its complexity.
//
// So this renderer COMPOSES the existing canvas-2D renderer (drawChoroplethMapCanvas)
// directly onto the caller-supplied canvas, the same "reuse the shared building
// block" spirit as every other renderWebgpu.ts, just at a coarser grain (the
// whole 2D draw routine instead of individual push* primitives). It paints
// synchronously - no async GPU device, no onReady wiring - and always returns
// true (it always successfully paints).
import { drawChoroplethMapCanvas } from "./renderCanvas";
import type { ChoroplethMapRenderModel } from "./renderModel";

export interface ChoroplethWebgpuOptions {
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  /** Present for interface parity with every other chart's *Webgpu options (never
   * invoked - this renderer has no async device to wait on). */
  onReady?: () => void;
}

export function drawChoroplethMapWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: ChoroplethMapRenderModel,
  o: ChoroplethWebgpuOptions,
): boolean {
  drawChoroplethMapCanvas(canvas, svg, model, {
    width: o.width,
    height: o.height,
    strokeColor: o.strokeColor,
    strokeWidth: o.strokeWidth,
  });
  return true;
}
