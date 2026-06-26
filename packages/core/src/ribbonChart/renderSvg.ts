// Imperative SVG renderer for RibbonChart: connector ribbons (behind) + stacked
// column rects (front). Columns carry class "bar" + data-label-safe; ribbons
// "ribbon". Hover on columns highlights the key.
import { svgEl } from "../dom";
import type { RibbonColumn, RibbonRenderModel } from "./renderModel";

export interface RibbonSvgOptions {
  enableTransitions: boolean;
}

export interface RibbonInteractions {
  onEnter: (col: RibbonColumn, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (col: RibbonColumn, ev: MouseEvent) => void;
}

export function renderRibbonSvg(
  parent: SVGElement,
  model: RibbonRenderModel,
  o: RibbonSvgOptions,
  ia: RibbonInteractions
): void {
  const root = svgEl("g", { class: "ribbon-chart-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  // Ribbons first (behind the columns).
  for (const rb of model.ribbons) {
    const path = svgEl("path", {
      class: "ribbon",
      "data-label": rb.key,
      "data-label-safe": rb.safe,
      d: rb.path,
      fill: rb.color,
      opacity: rb.dimmed ? 0.05 : 0.35,
    });
    path.style.transition = transition;
    root.appendChild(path);
  }

  // Columns.
  for (const col of model.columns) {
    const rect = svgEl("rect", {
      class: "bar",
      "data-label": col.key,
      "data-label-safe": col.safe,
      x: col.x,
      y: col.y,
      width: col.width,
      height: col.height,
      fill: col.color,
      opacity: col.dimmed ? 0.15 : 1,
    });
    rect.style.cursor = "pointer";
    rect.style.transition = transition;
    rect.addEventListener("mouseenter", (e) => ia.onEnter(col, e));
    rect.addEventListener("mouseleave", (e) => ia.onLeave(e));
    rect.addEventListener("click", (e) => ia.onClick(col, e));
    root.appendChild(rect);
  }

  parent.appendChild(root);
}
