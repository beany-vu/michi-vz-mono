// EXPERIMENTAL opt-in WebGPU renderer for GapChart - the third sibling to
// renderSvg.ts / renderCanvas.ts, consuming the SAME GapRenderModel. Builds a
// chart-agnostic MarkBatch (../webgpu/marks.ts) and hands it to drawMarksWebgpu:
// gap bars → pushRect, the white connecting line → pushStroke, value1/value2
// markers → pushCircle/pushRect/pushFan depending on shape. Colours are resolved
// through the SAME light-DOM probe canvas mode uses, so consumer CSS still
// reaches GPU pixels. Text/axes/title/legend stay on the SVG layer.
import {
  emptyBatch,
  pushRect,
  pushStroke,
  pushCircle,
  pushFan,
  markColor,
  drawMarksWebgpu,
} from "../webgpu/marks";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import type { GapRenderModel, GapElement } from "./renderModel";
import type { Shape } from "../types";

export interface GapWebgpuOptions {
  width: number;
  height: number;
  shapeValue1: Shape;
  shapeValue2: Shape;
  /** Called once when the GPU device becomes ready, so the engine can re-render. */
  onReady?: () => void;
}

function addMarker(
  batch: ReturnType<typeof emptyBatch>,
  shape: Shape,
  x: number,
  cy: number,
  c: ReturnType<typeof markColor>,
): void {
  if (shape === "square") {
    pushRect(batch.triangles, x - 7, cy - 7, 14, 14, c);
  } else if (shape === "triangle") {
    const R = 8;
    pushFan(
      batch.triangles,
      x,
      cy,
      [
        [x, cy - R],
        [x + R * 0.866, cy + R / 2],
        [x - R * 0.866, cy + R / 2],
      ],
      c,
    );
  } else {
    pushCircle(batch.circles, x, cy, 6.3, c);
  }
}

export function drawGapWebgpu(
  canvas: HTMLCanvasElement | null,
  svg: SVGSVGElement | null,
  model: GapRenderModel,
  o: GapWebgpuOptions,
): boolean {
  const labels = model.elements.map((e) => e.d.label);
  const byLabel = (pick: (e: GapElement) => string) => {
    const m = new Map<string, string>();
    model.elements.forEach((e) => m.set(e.d.label, pick(e)));
    return m;
  };
  const gapFallback = byLabel((e) => e.gapColor);
  const v1Fallback = byLabel((e) => e.value1Color);
  const v2Fallback = byLabel((e) => e.value2Color);

  const gapColors = resolveMarkColors(
    svg,
    labels,
    (l) => gapFallback.get(l) || "transparent",
    makeSimpleProbe("rect", "gap-bar", "fill"),
    "fill",
  );
  const v1Colors = resolveMarkColors(
    svg,
    labels,
    (l) => v1Fallback.get(l) || "transparent",
    makeSimpleProbe(
      o.shapeValue1 === "square" ? "rect" : "path",
      "gap-marker value1-marker",
      "fill",
    ),
    "fill",
  );
  const v2Colors = resolveMarkColors(
    svg,
    labels,
    (l) => v2Fallback.get(l) || "transparent",
    makeSimpleProbe(
      o.shapeValue2 === "square" ? "rect" : "path",
      "gap-marker value2-marker",
      "fill",
    ),
    "fill",
  );

  const batch = emptyBatch();

  for (const el of model.elements) {
    const { d, y, barHeight, x1, x2, barWidth, barOpacity, markerOpacity, value1X, value2X } = el;
    const center = y + barHeight / 2;
    const label = d.label;

    // gap bar (rect; GPU has no roundRect primitive, matches canvas fill area)
    const gapC = markColor(gapColors.get(label) || el.gapColor, barOpacity);
    pushRect(batch.triangles, x1, center - 4, barWidth, 8, gapC);

    // connecting line (dashed diff not expressible in the shared stroke helper -
    // draw solid; SVG/canvas keep the exact dash pattern).
    const lineC = markColor("white", markerOpacity);
    pushStroke(
      batch.triangles,
      [
        [x1, center],
        [x2, center],
      ],
      2,
      lineC,
    );

    // markers
    const v1C = markColor(v1Colors.get(label) || el.value1Color, markerOpacity);
    addMarker(batch, o.shapeValue1, value1X, center, v1C);
    const v2C = markColor(v2Colors.get(label) || el.value2Color, markerOpacity);
    addMarker(batch, o.shapeValue2, value2X, center, v2C);
  }

  return drawMarksWebgpu(canvas, batch, { width: o.width, height: o.height, onReady: o.onReady });
}
