// Imperative SVG renderer for RangeChart: one <path class="area"> band per series
// (+ a thin median line), each with data-label + data-label-safe. Hover per band.
import { svgEl } from "../dom";
import type { RangeRenderModel, RangeSeriesModel } from "./renderModel";

export interface RangeSvgOptions {
  fillOpacity: number;
  enableTransitions: boolean;
}

export interface RangeInteractions {
  onEnter: (s: RangeSeriesModel, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (s: RangeSeriesModel, ev: MouseEvent) => void;
}

export function renderRangeSvg(
  parent: SVGElement,
  model: RangeRenderModel,
  o: RangeSvgOptions,
  ia: RangeInteractions
): void {
  const root = svgEl("g", { class: "range-chart-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  for (const s of model.series) {
    if (!s.areaPath) continue;
    const g = svgEl("g", { class: "area-group", "data-label": s.label, "data-label-safe": s.safe });
    g.style.opacity = s.dimmed ? "0.1" : String(o.fillOpacity);
    g.style.transition = transition;

    const band = svgEl("path", {
      class: "area",
      "data-label": s.label,
      "data-label-safe": s.safe,
      d: s.areaPath,
      fill: s.color,
      stroke: "none",
    });
    band.style.cursor = "pointer";
    band.addEventListener("mouseenter", (e) => ia.onEnter(s, e));
    band.addEventListener("mouseleave", (e) => ia.onLeave(e));
    band.addEventListener("click", (e) => ia.onClick(s, e));
    g.appendChild(band);

    if (s.medianPath) {
      g.appendChild(
        svgEl("path", {
          class: "range-median",
          "data-label": s.label,
          "data-label-safe": s.safe,
          d: s.medianPath,
          fill: "none",
          stroke: s.color,
          "stroke-width": 1.5,
          opacity: 0.9,
        })
      );
    }
    root.appendChild(g);
  }

  parent.appendChild(root);
}
