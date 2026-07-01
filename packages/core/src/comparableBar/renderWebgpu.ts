// EXPERIMENTAL opt-in WebGPU renderer for ComparableHorizontalBar — the third
// sibling to renderSvg.ts / renderCanvas.ts, consuming the SAME
// ComparableRenderModel. Each label's two sub-bars (value-based behind,
// value-compared in front) are drawn as GPU rects via the shared marks.ts layer.
// Sub-bar fill colours are resolved through the SAME dual nested probes canvas
// mode uses, so consumer CSS still reaches GPU pixels. Text/axes/title stay on
// the SVG layer. PoC scope: bars are flat rects (no rounded corners, no hatch
// PATTERN fill — pattern-filled value-based bars are omitted in webgpu mode;
// use renderer="canvas"/"svg" for exact rounded-rect + pattern rendering).
import { emptyBatch, pushRect, markColor, drawMarksWebgpu } from "../webgpu/marks";
import { resolveMarkColors, makeSubBarProbe } from "../canvas/resolveMarkColors";
import type { ComparableRenderModel } from "./renderModel";

export interface ComparableWebgpuOptions {
  width: number;
  height: number;
  valueBasedOpacity: number;
  valueComparedOpacity: number;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

const isTransparent = (c: string): boolean =>
  c === "transparent" || c === "rgba(0, 0, 0, 0)" || c === "rgba(0,0,0,0)";

export function drawComparableBarWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: ComparableRenderModel,
  o: ComparableWebgpuOptions
): boolean {
  // Resolve sub-bar fill colours through the SAME dual nested probes canvas
  // mode uses (descendant consumer CSS like `.bar[data-label-safe="X"] .value-based`).
  const labels = model.bars.map((b) => b.label);
  const fb = (l: string) => model.bars.find((b) => b.label === l)?.color || "transparent";
  const basedColors = resolveMarkColors(svg, labels, fb, makeSubBarProbe("value-based"), ["fill", "stroke"]);
  const comparedColors = resolveMarkColors(svg, labels, fb, makeSubBarProbe("value-compared"), ["fill", "stroke"]);

  const batch = emptyBatch();
  for (const bar of model.bars) {
    const groupAlpha = bar.dimmed ? 0.3 : 1;
    const parts = [
      { seg: bar.based, opacity: o.valueBasedOpacity, color: basedColors.get(bar.label) || bar.color },
      { seg: bar.compared, opacity: o.valueComparedOpacity, color: comparedColors.get(bar.label) || bar.color },
    ];
    for (const part of parts) {
      // transparent-skip: a consumer hides a sub-bar with fill:transparent.
      if (isTransparent(part.color)) continue;
      if (part.seg.width <= 0) continue;
      pushRect(
        batch.triangles,
        part.seg.x,
        bar.y,
        part.seg.width,
        bar.height,
        markColor(part.color, groupAlpha * part.opacity)
      );
    }
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
