// EXPERIMENTAL opt-in WebGPU renderer for RibbonChart - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME RibbonRenderModel. Columns are
// tessellated as RECTs and ribbon connectors as BAND STRIPs (both flat-edged
// quadrilaterals - no bezier sampling needed here), reusing the shared
// packages/core/src/webgpu/marks.ts GPU layer. Fill colours are resolved through
// the SAME light-DOM colour probe as canvas mode, so consumer CSS still reaches
// GPU pixels. Text/axes/title stay on the SVG layer. Device acquisition is async;
// while the device is not ready this returns false and the engine paints the
// canvas-2D stopgap, then re-renders.
import { drawMarksWebgpu, emptyBatch, pushRect, pushBandStrip, markColor } from "../webgpu/marks";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { RibbonRenderModel } from "./renderModel";

export interface RibbonWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

/**
 * Draw a RibbonChart render model to `canvas` via WebGPU. Returns false when the
 * device/context is not (yet) available - the caller should then paint the
 * canvas-2D fallback (drawRibbonCanvas) so the chart is never blank.
 */
export function drawRibbonWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: RibbonRenderModel,
  o: RibbonWebgpuOptions,
): boolean {
  // Resolve fill colours through the SAME probe canvas mode uses (rect.bar[data-label-safe]).
  const keys = [...new Set(model.columns.map((c) => c.key))];
  const fallback = new Map(model.columns.map((c) => [c.key, c.color]));
  const fillColors = resolveMarkColors(
    svg,
    keys,
    (k) => fallback.get(k) || "transparent",
    makeSimpleProbe("rect", "bar", "fill"),
    "fill",
  );
  const colorOf = (key: string, fb: string): string => fillColors.get(key) || fb;

  const batch = emptyBatch();

  // Ribbon connectors first (drawn under the columns, matching canvas mode's order),
  // as flat-edged quadrilaterals: top edge [start-top, end-top], bottom edge
  // [start-bottom, end-bottom]. Each connector's path is `M rx,top L lx,top L lx,bottom
  // L rx,bottom Z` (see ribbonChart/renderModel.ts), so top/bottom are already ordered
  // 2-point polylines - no bezier sampling required.
  for (const rb of model.ribbons) {
    const col = model.columns.find((c) => c.key === rb.key);
    const css = colorOf(rb.key, col?.color ?? "transparent");
    const opacity = rb.dimmed ? 0.05 : 0.35;
    const c = markColor(css, opacity);
    if (c[3] <= 0) continue;
    const pts = parseRibbonPath(rb.path);
    if (!pts) continue;
    const { rx, lx, top1, top2, bottom1, bottom2 } = pts;
    pushBandStrip(
      batch.triangles,
      [
        [rx, top1],
        [lx, top2],
      ],
      [
        [rx, bottom1],
        [lx, bottom2],
      ],
      c,
    );
  }

  for (const col of model.columns) {
    const css = colorOf(col.key, col.color);
    const opacity = col.dimmed ? 0.15 : 1;
    const c = markColor(css, opacity);
    if (c[3] <= 0) continue;
    pushRect(batch.triangles, col.x, col.y, col.width, col.height, c);
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}

/**
 * Parse a ribbon connector's `M rx,topA L lx,topB L lx,bottomB L rx,bottomA Z` path
 * (built in ribbonChart/renderModel.ts) back into its four corner y-values.
 */
function parseRibbonPath(
  path: string,
): { rx: number; lx: number; top1: number; top2: number; bottom1: number; bottom2: number } | null {
  const nums = path.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 8) return null;
  const [rx, top1, lx, top2, , bottom2, , bottom1] = nums.map(Number);
  return { rx, lx, top1, top2, bottom1, bottom2 };
}
