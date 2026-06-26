// Imperative SVG renderer for ScatterPlot: one mark per point (circle / square /
// triangle), class "scatter-point" + data-label/data-label-safe so the consumer
// colour contract + canvas probe match. Hover wiring per mark.
import { svgEl } from "../dom";
import type { ScatterPointModel, ScatterRenderModel } from "./renderModel";

export interface ScatterSvgOptions {
  enableTransitions: boolean;
}

export interface ScatterInteractions {
  onEnter: (p: ScatterPointModel, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (p: ScatterPointModel, ev: MouseEvent) => void;
}

function mark(p: ScatterPointModel): SVGElement {
  const common = {
    class: "scatter-point",
    "data-label": p.label,
    "data-label-safe": p.safe,
    fill: p.color,
    stroke: "#fff",
    "stroke-width": 2,
    opacity: p.dimmed ? 0.1 : 0.9,
  };
  if (p.shape === "square") {
    return svgEl("rect", { ...common, x: p.cx - p.r, y: p.cy - p.r, width: p.r * 2, height: p.r * 2 });
  }
  if (p.shape === "triangle") {
    const d = `M${p.cx},${p.cy - p.r} L${p.cx + p.r},${p.cy + p.r} L${p.cx - p.r},${p.cy + p.r} Z`;
    return svgEl("path", { ...common, d });
  }
  return svgEl("circle", { ...common, cx: p.cx, cy: p.cy, r: p.r });
}

export function renderScatterSvg(
  parent: SVGElement,
  model: ScatterRenderModel,
  o: ScatterSvgOptions,
  ia: ScatterInteractions
): void {
  const root = svgEl("g", { class: "scatter-chart-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  for (const p of model.points) {
    const node = mark(p);
    node.style.cursor = "pointer";
    node.style.transition = transition;
    node.addEventListener("mouseenter", (e) => ia.onEnter(p, e));
    node.addEventListener("mouseleave", (e) => ia.onLeave(e));
    node.addEventListener("click", (e) => ia.onClick(p, e));
    root.appendChild(node);
  }

  parent.appendChild(root);
}
