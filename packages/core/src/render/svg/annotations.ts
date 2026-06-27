// Generic annotations layer (threshold/goal lines, "fall point" markers, bands).
// Drawn on the SVG layer — which every chart keeps present even in canvas mode
// (axes/title live there too), so one SVG renderer covers both render modes.
//
// It is decorative (no data-label / colour-probe contract) and carries NO ML — it
// lives in core so it is reusable for static, user-defined reference lines as well
// as the forecast-driven annotations the @michi-vz/insights `annotate()` hook emits.
// The engine supplies value->pixel projection closures so this stays scale-agnostic.
import { svgEl } from "../../dom";
import type { Annotation } from "../../plugins/types";

export interface AnnotationRenderContext {
  /** map a y data value to a pixel y. */
  yPx: (value: number) => number;
  /** map an x axis position to a pixel x. */
  xPx: (at: number | string) => number;
  /** plot rectangle in pixels. */
  plot: { left: number; right: number; top: number; bottom: number };
}

// Geneva red — a sensible default; consumers override per-annotation via `color`.
const DEFAULT_COLOR = "#d4351c";

function appendLabel(
  g: SVGGElement,
  text: string,
  x: number,
  y: number,
  color: string,
  anchor: "start" | "end"
): void {
  const t = svgEl("text", {
    class: "mv-annotation-label",
    x,
    y,
    "text-anchor": anchor,
    fill: color,
    "font-size": 11,
  });
  t.style.pointerEvents = "none";
  t.textContent = text;
  g.appendChild(t);
}

/** Append an <g class="mv-annotations"> with one shape per annotation. */
export function renderAnnotationsSvg(
  parent: SVGElement,
  annotations: Annotation[],
  ctx: AnnotationRenderContext
): void {
  if (annotations.length === 0) return;
  const g = svgEl("g", { class: "mv-annotations" }) as SVGGElement;
  const { left, right, top, bottom } = ctx.plot;

  for (const a of annotations) {
    const color = a.color ?? DEFAULT_COLOR;
    const dash = a.dashed ? "5,4" : undefined;

    if (a.type === "hline" && a.value != null) {
      const y = ctx.yPx(a.value);
      g.appendChild(
        svgEl("line", {
          class: "mv-annotation-line",
          x1: left,
          x2: right,
          y1: y,
          y2: y,
          stroke: color,
          "stroke-width": 1.5,
          "stroke-dasharray": dash,
        })
      );
      if (a.label) appendLabel(g, a.label, right - 4, y - 4, color, "end");
    } else if (a.type === "vline" && a.at != null) {
      const x = ctx.xPx(a.at);
      g.appendChild(
        svgEl("line", {
          class: "mv-annotation-line",
          x1: x,
          x2: x,
          y1: top,
          y2: bottom,
          stroke: color,
          "stroke-width": 1.5,
          "stroke-dasharray": dash,
        })
      );
      if (a.label) appendLabel(g, a.label, x + 4, top + 12, color, "start");
    } else if (a.type === "point" && a.at != null && a.value != null) {
      const x = ctx.xPx(a.at);
      const y = ctx.yPx(a.value);
      g.appendChild(
        svgEl("circle", {
          class: "mv-annotation-point",
          cx: x,
          cy: y,
          r: 4,
          fill: color,
          stroke: "#fff",
          "stroke-width": 1,
        })
      );
      if (a.label) appendLabel(g, a.label, x + 6, y - 6, color, "start");
    } else if (a.type === "band" && a.value != null && a.value2 != null) {
      const ya = ctx.yPx(a.value);
      const yb = ctx.yPx(a.value2);
      g.appendChild(
        svgEl("rect", {
          class: "mv-annotation-band",
          x: left,
          y: Math.min(ya, yb),
          width: right - left,
          height: Math.abs(yb - ya),
          fill: color,
          opacity: 0.12,
        })
      );
      if (a.label) appendLabel(g, a.label, right - 4, Math.min(ya, yb) + 12, color, "end");
    } else if (a.type === "xband" && a.at != null && a.at2 != null) {
      // a full-height vertical region (e.g. the forecast zone) — drawn faint so the
      // marks read through it.
      const x1 = ctx.xPx(a.at);
      const x2 = ctx.xPx(a.at2);
      g.appendChild(
        svgEl("rect", {
          class: "mv-annotation-zone",
          x: Math.min(x1, x2),
          y: top,
          width: Math.abs(x2 - x1),
          height: bottom - top,
          fill: color,
          opacity: a.opacity ?? 0.08,
        })
      );
      if (a.label) appendLabel(g, a.label, Math.min(x1, x2) + 6, top + 12, color, "start");
    }
  }

  parent.appendChild(g);
}
