// Imperative SVG renderer for ChoroplethMap: one <path class="region"> per
// geography feature, filled per renderModel.ts and bordered with strokeColor -
// ported from legacy MapChoropleth/Chart.js's <CountryPath> (fill/stroke swap,
// pointer cursor, per-feature tooltip). Single-element marks (no sub-marks, no
// dual-form colour probe needed - see renderCanvas.ts's comment).
import { svgEl } from "../dom";
import type { ChoroplethMapRenderModel, ChoroplethFeatureMark } from "./renderModel";

export interface ChoroplethSvgOptions {
  strokeColor: string;
  strokeWidth: number;
  enableTransitions: boolean;
}

export interface ChoroplethInteractions {
  onEnter: (mark: ChoroplethFeatureMark, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (mark: ChoroplethFeatureMark, ev: MouseEvent) => void;
}

export function renderChoroplethSvg(
  parent: SVGElement,
  model: ChoroplethMapRenderModel,
  o: ChoroplethSvgOptions,
  ia: ChoroplethInteractions,
): void {
  const root = svgEl("g", { class: "choropleth-map-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  for (const mark of model.features) {
    // No path data (empty/invalid geometry) - nothing to draw; already reported
    // via onDataWarning (see validate/choroplethMapWarnings.ts).
    if (!mark.d) continue;

    const path = svgEl("path", {
      class: "region",
      "data-label": mark.id,
      "data-label-safe": mark.safe,
      d: mark.d,
      fill: mark.color,
      stroke: o.strokeColor,
      "stroke-width": o.strokeWidth,
    });
    path.style.opacity = mark.dimmed ? "0.3" : "1";
    path.style.transition = transition;
    path.style.cursor = "pointer";
    path.addEventListener("mouseenter", (e) => ia.onEnter(mark, e));
    path.addEventListener("mouseleave", (e) => ia.onLeave(e));
    path.addEventListener("click", (e) => ia.onClick(mark, e));
    root.appendChild(path);
  }

  parent.appendChild(root);
}
