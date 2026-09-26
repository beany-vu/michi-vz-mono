// Imperative SVG renderer for AreaChart: one <path class="area"> per key, each
// carrying data-label + data-label-safe so the consumer colour contract
// (`.area[data-label-safe] { fill }`) and the canvas probe match. Stacked (default):
// opaque fills bottom-to-top with a white seam. Overlapping (stacked:false): the
// fills are translucent and drawn largest first, then a <path class="area-line"> per
// key traces each area's top edge in the series colour, above every fill. Marks are
// pointer-events:none - hover is handled by a transparent overlay the engine adds
// (so hit-testing is uniform across SVG and canvas).
import { svgEl } from "../dom";
import {
  AREA_DIMMED_OPACITY,
  AREA_OVERLAP_FILL_OPACITY,
  AREA_OVERLAP_LINE_WIDTH,
  type AreaRenderModel,
} from "./renderModel";

export interface AreaSvgOptions {
  enableTransitions: boolean;
  /** Overlapping mode: resolved stroke colour per key for the top lines (the same
   * probe-resolved colour canvas uses, so consumer `.area` CSS reaches the line too).
   * Falls back to the series fill. */
  lineColors?: Map<string, string>;
}

export function renderAreaSvg(parent: SVGElement, model: AreaRenderModel, o: AreaSvgOptions): void {
  const root = svgEl("g", { class: "area-chart-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";
  const overlap = model.mode === "overlap";

  for (const s of model.series) {
    if (!s.path) continue;
    const opacity = s.dimmed ? AREA_DIMMED_OPACITY : 1;
    const path = svgEl(
      "path",
      overlap
        ? {
            class: "area",
            "data-label": s.key,
            "data-label-safe": s.safe,
            d: s.path,
            fill: s.fill,
            "fill-opacity": AREA_OVERLAP_FILL_OPACITY,
            stroke: "none",
            opacity,
          }
        : {
            class: "area",
            "data-label": s.key,
            "data-label-safe": s.safe,
            d: s.path,
            fill: s.fill,
            stroke: "#fff",
            "stroke-width": 1,
            opacity,
          },
    );
    path.style.pointerEvents = "none";
    path.style.transition = transition;
    root.appendChild(path);
  }

  if (overlap) {
    for (const s of model.series) {
      if (!s.linePath) continue;
      const line = svgEl("path", {
        class: "area-line",
        "data-label": s.key,
        "data-label-safe": s.safe,
        d: s.linePath,
        fill: "none",
        stroke: o.lineColors?.get(s.key) || s.fill,
        "stroke-width": AREA_OVERLAP_LINE_WIDTH,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
        opacity: s.dimmed ? AREA_DIMMED_OPACITY : 1,
      });
      line.style.pointerEvents = "none";
      line.style.transition = transition;
      root.appendChild(line);
    }
  }

  parent.appendChild(root);
}
