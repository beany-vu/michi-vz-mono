// Imperative SVG renderer for RadarChart: polar grid (rings/spokes/labels) then a
// <polygon class="radar-area"> per series (+ pole circles). data-label-safe on the
// polygons so the colour contract + canvas probe match. Hover per polygon.
import { svgEl } from "../dom";
import type { RadarRenderModel, RadarSeriesModel } from "./renderModel";

export interface RadarSvgOptions {
  fillOpacity: number;
  enableTransitions: boolean;
}

export interface RadarInteractions {
  onEnter: (s: RadarSeriesModel, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (s: RadarSeriesModel, ev: MouseEvent) => void;
}

export function renderRadarSvg(
  parent: SVGElement,
  model: RadarRenderModel,
  o: RadarSvgOptions,
  ia: RadarInteractions
): void {
  const root = svgEl("g", { class: "radar-chart-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";
  const g = model.grid;

  // Grid rings + spokes + labels.
  const grid = svgEl("g", { class: "mv-radar-grid" });
  for (const ring of g.rings) {
    grid.appendChild(
      svgEl("polygon", { points: ring, fill: "none", stroke: "var(--michi-vz-grid, lightgray)", "stroke-width": 1 })
    );
  }
  for (const sp of g.spokes) {
    grid.appendChild(
      svgEl("line", { x1: g.cx, y1: g.cy, x2: sp.x, y2: sp.y, stroke: "var(--michi-vz-grid, lightgray)", "stroke-width": 1 })
    );
  }
  for (const lbl of g.axisLabels) {
    const t = svgEl("text", { class: "mv-axis-label", x: lbl.x, y: lbl.y, "text-anchor": lbl.anchor, "dominant-baseline": "middle" });
    t.textContent = lbl.text;
    grid.appendChild(t);
  }
  root.appendChild(grid);

  // Series polygons + pole points.
  for (const s of model.series) {
    const sg = svgEl("g", { class: "series", "data-label": s.label, "data-label-safe": s.safe });
    sg.style.opacity = s.dimmed ? "0.15" : "1";
    sg.style.transition = transition;

    const poly = svgEl("polygon", {
      class: "radar-area",
      "data-label": s.label,
      "data-label-safe": s.safe,
      points: s.points,
      fill: s.color,
      "fill-opacity": o.fillOpacity,
      stroke: s.color,
      "stroke-width": 2,
    });
    poly.style.cursor = "pointer";
    poly.addEventListener("mouseenter", (e) => ia.onEnter(s, e));
    poly.addEventListener("mouseleave", (e) => ia.onLeave(e));
    poly.addEventListener("click", (e) => ia.onClick(s, e));
    sg.appendChild(poly);

    for (const p of s.poles) {
      sg.appendChild(
        svgEl("circle", { class: "radar-pole", "data-label": s.label, "data-label-safe": s.safe, cx: p.x, cy: p.y, r: 3, fill: s.color })
      );
    }
    root.appendChild(sg);
  }

  parent.appendChild(root);
}
