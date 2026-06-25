// Imperative SVG mark renderer — port of GapChart.tsx's `renderGapBars` JSX.
// Emits the same node structure + classes + data-label/data-label-safe attrs so
// the consumer colour contract (`.gap-bar[data-label-safe="X"] { fill }`) and
// the canvas colour probe keep working identically.
import { svgEl } from "../dom";
import { sanitizeForClassName } from "../math/sanitize";
import { getShapePath, getSquareDimensions } from "./shapes";
import type { GapDataItem, Shape } from "../types";
import type { GapRenderModel, GapElement } from "./renderModel";

export interface GapSvgOptions {
  shapeValue1: Shape;
  shapeValue2: Shape;
  squareRadius: number;
  enableTransitions: boolean;
}

export interface GapInteractions {
  onEnter: (d: GapDataItem, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (d: GapDataItem, ev: MouseEvent) => void;
}

function wire(node: SVGElement, d: GapDataItem, ia: GapInteractions): void {
  node.style.cursor = "pointer";
  node.addEventListener("mouseenter", (e) => ia.onEnter(d, e));
  node.addEventListener("mouseleave", (e) => ia.onLeave(e));
  node.addEventListener("click", (e) => ia.onClick(d, e));
}

function marker(
  el: GapElement,
  shape: Shape,
  x: number,
  color: string,
  squareRadius: number,
  cls: string
): SVGElement {
  const { d, y, barHeight, markerOpacity } = el;
  const center = y + barHeight / 2;
  const safe = sanitizeForClassName(d.label);
  if (shape === "square") {
    const dims = getSquareDimensions();
    return svgEl("rect", {
      class: `gap-marker ${cls}`,
      "data-label": d.label,
      "data-label-safe": safe,
      x: x + dims.x,
      y: center + dims.y,
      width: dims.width,
      height: dims.height,
      fill: color,
      opacity: markerOpacity,
      rx: squareRadius,
      ry: squareRadius,
    });
  }
  return svgEl("path", {
    class: `gap-marker ${cls}`,
    "data-label": d.label,
    "data-label-safe": safe,
    d: getShapePath(shape) || "",
    transform: `translate(${x}, ${center})`,
    fill: color,
    opacity: markerOpacity,
  });
}

export function renderGapSvg(
  parent: SVGElement,
  model: GapRenderModel,
  o: GapSvgOptions,
  ia: GapInteractions
): void {
  const root = svgEl("g", { class: "gap-chart-content" });
  const transition = o.enableTransitions ? "all 0.1s ease-in-out" : "none";

  // Layer 1 — gap bars + connecting lines
  for (const el of model.elements) {
    const { d, y, barHeight, gapColor, x1, x2, barWidth, barOpacity, markerOpacity } = el;
    const center = y + barHeight / 2;
    const safe = sanitizeForClassName(d.label);

    const bar = svgEl("rect", {
      class: "gap-bar",
      "data-label": d.label,
      "data-label-safe": safe,
      x: x1,
      y: center - 4,
      width: barWidth,
      height: 8,
      fill: gapColor,
      opacity: barOpacity,
      rx: 4,
      ry: 4,
    });
    bar.style.transition = transition;
    wire(bar, d, ia);
    root.appendChild(bar);

    const diff = d.difference ?? d.value1 - d.value2;
    const line = svgEl("line", {
      class: "gap-line",
      "data-label": d.label,
      "data-label-safe": safe,
      x1,
      y1: center,
      x2,
      y2: center,
      stroke: "white",
      "stroke-dasharray": diff < 0 ? "4,2" : "0",
      opacity: markerOpacity,
    });
    line.style.transition = transition;
    root.appendChild(line);
  }

  // Layer 2 — value markers
  for (const el of model.elements) {
    const { d, value1X, value2X, value1Color, value2Color } = el;
    const m1 = marker(el, o.shapeValue1, value1X, value1Color, o.squareRadius, "value1-marker");
    m1.style.transition = transition;
    wire(m1, d, ia);
    root.appendChild(m1);

    const m2 = marker(el, o.shapeValue2, value2X, value2Color, o.squareRadius, "value2-marker");
    m2.style.transition = transition;
    wire(m2, d, ia);
    root.appendChild(m2);
  }

  parent.appendChild(root);
}
