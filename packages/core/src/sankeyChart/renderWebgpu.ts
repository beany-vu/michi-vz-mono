// EXPERIMENTAL opt-in WebGPU renderer for Sankey - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME SankeyRenderModel. Nodes are
// drawn as filled rects (pushRect) and link ribbons are sampled into a top/bottom
// polyline pair and drawn as a filled band (pushBandStrip), then handed to the
// shared GPU mark layer (webgpu/marks.ts). Text/title stays on the SVG layer;
// fill colours are resolved through the SAME light-DOM probes canvas mode uses, so
// consumer CSS still reaches GPU pixels. Device acquisition is async; while not
// ready this returns false and the engine paints the canvas-2D fallback.
import {
  drawMarksWebgpu,
  emptyBatch,
  pushRect,
  pushBandStrip,
  markColor,
} from "../webgpu/marks";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { SankeyRenderModel } from "./renderModel";

export interface SankeyWebgpuOptions {
  width: number;
  height: number;
  /** Called once when the GPU device becomes ready, so the engine re-renders. */
  onReady?: () => void;
}

// Number of samples along each link ribbon's top/bottom edge (the ribbon path is a
// cubic-ish curve between the source/target bands; more samples = smoother band).
const LINK_SAMPLES = 24;

/** Sample the ribbon's top and bottom edges as polylines (mirrors ribbonPath's curve). */
function sampleRibbon(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  width: number
): { top: Array<[number, number]>; bottom: Array<[number, number]> } {
  const hw = width / 2;
  const mx = (sx + tx) / 2;
  const top: Array<[number, number]> = [];
  const bottom: Array<[number, number]> = [];
  for (let i = 0; i <= LINK_SAMPLES; i++) {
    const t = i / LINK_SAMPLES;
    const x = cubicBezier(sx, mx, mx, tx, t);
    const y = cubicBezier(sy - hw, sy - hw, ty - hw, ty - hw, t);
    top.push([x, y]);
  }
  for (let i = 0; i <= LINK_SAMPLES; i++) {
    const t = i / LINK_SAMPLES;
    const x = cubicBezier(sx, mx, mx, tx, t);
    const y = cubicBezier(sy + hw, sy + hw, ty + hw, ty + hw, t);
    bottom.push([x, y]);
  }
  return { top, bottom };
}

function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export function drawSankeyWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: SankeyRenderModel,
  o: SankeyWebgpuOptions
): boolean {
  // Resolve colours through the SAME probes canvas mode uses (rect.node fill,
  // path.link fill), so consumer CSS reaches GPU pixels identically.
  const nodeFallback = new Map<string, string>();
  for (const n of model.nodes) if (!nodeFallback.has(n.colorKey)) nodeFallback.set(n.colorKey, n.fill);
  const nodeColors = resolveMarkColors(
    svg,
    model.nodeKeys,
    (k) => nodeFallback.get(k) || "transparent",
    makeSimpleProbe("rect", "node", "fill"),
    "fill"
  );
  const linkColors = resolveMarkColors(
    svg,
    model.nodeKeys,
    (k) => nodeFallback.get(k) || "transparent",
    makeSimpleProbe("path", "link", "fill"),
    "fill"
  );

  const anyHighlight = model.highlightSet.size > 0;
  const batch = emptyBatch();

  // ---- Links (under the nodes) ----
  for (const l of model.links) {
    const lit =
      !anyHighlight || model.highlightSet.has(l.sourceId) || model.highlightSet.has(l.targetId);
    const css = linkColors.get(l.colorKey) || l.color;
    const c = markColor(css, lit ? model.linkOpacity : model.linkOpacity * 0.25);
    if (c[3] <= 0) continue;
    // The mark only carries the finished SVG path string (+ width), not the raw
    // sx/sy/tx/ty centreline the model computed - recover it exactly from the path's
    // own coordinates (see parseRibbonEndpoints), then resample top/bottom edges at
    // GPU-friendly resolution for pushBandStrip.
    const pts = parseRibbonEndpoints(l.d);
    if (!pts) continue;
    const { top, bottom } = sampleRibbon(pts.sx, pts.sy, pts.tx, pts.ty, l.width);
    pushBandStrip(batch.triangles, top, bottom, c);
  }

  // ---- Nodes (on top of links) ----
  for (const n of model.nodes) {
    const lit = !anyHighlight || model.highlightSet.has(n.id);
    const css = nodeColors.get(n.colorKey) || n.fill;
    const c = markColor(css, lit ? 1 : 0.25);
    if (c[3] <= 0) continue;
    pushRect(batch.triangles, n.x, n.y, n.w, n.h, c);
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}

/**
 * Extract the ribbon's source/target centreline endpoints (sx,sy / tx,ty) from the
 * `d` path string produced by renderModel's ribbonPath(). The path always begins
 * `M{sx},{sTop+r}` (top-left corner start) and its horizontal extent matches
 * sx/tx; sy/ty are recovered as the vertical midpoint of the left/right edges.
 */
function parseRibbonEndpoints(d: string): { sx: number; sy: number; tx: number; ty: number } | null {
  // Pull every numeric token in order; the path is built from a fixed sequence of
  // M/Q/C/L commands over (sx,sTop..sBot) and (tx,tTop..tBot), so the min/max x are
  // sx/tx and the corresponding y extents average to sy/ty.
  const nums = d.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 4) return null;
  const vals = nums.map(Number);
  const xs = vals.filter((_, i) => i % 2 === 0);
  const ys = vals.filter((_, i) => i % 2 === 1);
  const sx = Math.min(...xs);
  const tx = Math.max(...xs);
  if (sx === tx) return null;
  const sYs: number[] = [];
  const tYs: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] === sx) sYs.push(ys[i]);
    else if (xs[i] === tx) tYs.push(ys[i]);
  }
  if (sYs.length === 0 || tYs.length === 0) return null;
  const sy = (Math.min(...sYs) + Math.max(...sYs)) / 2;
  const ty = (Math.min(...tYs) + Math.max(...tYs)) / 2;
  return { sx, sy, tx, ty };
}
