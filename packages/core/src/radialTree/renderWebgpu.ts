// WebGPU renderer for RadialTree - DELEGATED to the canvas-2D renderer, same
// rationale as ChoroplethMap/SymbolMap: every link is a CURVED cubic bezier (the
// dendrogram's radial spokes), and the shared webgpu/marks.ts primitives only
// tessellate straight-edged shapes (rects/fans) cheaply - real bezier
// tessellation is disproportionate scope for this chart. Always paints
// synchronously - no async GPU device, no onReady wiring (mirrors
// ChoroplethMap's/SymbolMap's own delegated renderers).
import { drawRadialTreeCanvas } from "./renderCanvas";
import type { RadialTreeRenderModel } from "./renderModel";

export interface RadialTreeWebgpuOptions {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  /** Present for interface parity with every other chart's *Webgpu options (never
   * invoked - this renderer has no async device to wait on). */
  onReady?: () => void;
}

export function drawRadialTreeWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: RadialTreeRenderModel,
  o: RadialTreeWebgpuOptions,
): boolean {
  drawRadialTreeCanvas(canvas, svg, model, {
    width: o.width,
    height: o.height,
    centerX: o.centerX,
    centerY: o.centerY,
  });
  return true;
}
