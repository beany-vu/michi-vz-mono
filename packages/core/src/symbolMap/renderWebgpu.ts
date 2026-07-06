// WebGPU renderer for SymbolMap - DELEGATED to the canvas-2D renderer, same
// rationale as ChoroplethMap's renderWebgpu.ts: the OPTIONAL backdrop is
// arbitrary GeoJSON (frequently concave/multi-ring/hole-containing), and the
// shared webgpu/marks.ts `pushFan` primitive only tessellates convex shapes
// correctly - real ear-clipping is disproportionate scope here, same as it was
// for ChoroplethMap. The symbol CIRCLES alone would tessellate trivially via
// `pushCircle` (as BubbleChart's renderWebgpu.ts does), but keeping backdrop +
// symbols on ONE code path (rather than a native circle path that silently loses
// the backdrop, or is only correct when `geography` is omitted) is the simpler,
// more honest contract for a chart whose backdrop is optional. Always paints
// synchronously - no async GPU device, no onReady wiring, unlike most other
// charts' webgpu renderers (mirrors ChoroplethMap's own delegated renderer).
import { drawSymbolMapCanvas } from "./renderCanvas";
import type { SymbolMapRenderModel } from "./renderModel";

export interface SymbolMapWebgpuOptions {
  width: number;
  height: number;
  showLabels: boolean;
  geographyColor: string;
  strokeColor: string;
  strokeWidth: number;
  /** Present for interface parity with every other chart's *Webgpu options (never
   * invoked - this renderer has no async device to wait on). */
  onReady?: () => void;
}

export function drawSymbolMapWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: SymbolMapRenderModel,
  o: SymbolMapWebgpuOptions
): boolean {
  drawSymbolMapCanvas(canvas, svg, model, {
    width: o.width,
    height: o.height,
    showLabels: o.showLabels,
    geographyColor: o.geographyColor,
    strokeColor: o.strokeColor,
    strokeWidth: o.strokeWidth,
  });
  return true;
}
