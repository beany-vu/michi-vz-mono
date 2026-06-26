// Imperative SVG renderer for AreaChart: one <path class="area"> per stacked key,
// bottom-to-top, each carrying data-label + data-label-safe so the consumer colour
// contract (`.area[data-label-safe] { fill }`) and the canvas probe match. Areas
// are pointer-events:none — hover is handled by a transparent overlay the engine
// adds (so hit-testing is uniform across SVG and canvas).
import { svgEl } from "../dom";
import type { AreaRenderModel } from "./renderModel";

export interface AreaSvgOptions {
  enableTransitions: boolean;
}

export function renderAreaSvg(parent: SVGElement, model: AreaRenderModel, o: AreaSvgOptions): void {
  const root = svgEl("g", { class: "area-chart-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  for (const s of model.series) {
    if (!s.path) continue;
    const path = svgEl("path", {
      class: "area",
      "data-label": s.key,
      "data-label-safe": s.safe,
      d: s.path,
      fill: s.fill,
      stroke: "#fff",
      "stroke-width": 1,
      opacity: s.dimmed ? 0.05 : 1,
    });
    path.style.pointerEvents = "none";
    path.style.transition = transition;
    root.appendChild(path);
  }

  parent.appendChild(root);
}
