// Imperative SVG renderer for Pie/donut. Slices live in a translated group so the
// arc paths (built around the origin) land at (cx,cy). Each slice is one
// <path class="slice"> with data-label + data-label-safe (the colour contract);
// an optional % label sits at the centroid. Highlight dimming (opacity) is
// computed here, not baked into the model.
import { svgEl } from "../dom";
import { readableTextColor } from "../math/contrast";
import type { PieSliceMark, PieRenderModel } from "./renderModel";

export interface PieSvgOptions {
  enableTransitions: boolean;
}

export interface PieInteractions {
  onEnter: (slice: PieSliceMark, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (slice: PieSliceMark, ev: MouseEvent) => void;
}

// Show the on-slice label only when the wedge is wide enough to fit it.
const LABEL_MIN_ANGLE = 0.28; // radians (~16°)

export function renderPieSvg(
  parent: SVGElement,
  model: PieRenderModel,
  o: PieSvgOptions,
  ia: PieInteractions
): void {
  const root = svgEl("g", {
    class: "pie-chart-content",
    transform: `translate(${model.cx},${model.cy})`,
  });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";
  const anyHighlight = model.highlightSet.size > 0;

  for (const d of model.slices) {
    const highlighted = !anyHighlight || model.highlightSet.has(d.label);
    const g = svgEl("g", { class: "slice-cell", opacity: highlighted ? 1 : 0.2 });

    const path = svgEl("path", {
      class: "slice",
      "data-label": d.colorKey,
      "data-label-safe": d.dataLabelSafe,
      d: d.d,
      fill: d.fill,
    });
    g.appendChild(path);

    if (model.showLabels && d.endAngle - d.startAngle >= LABEL_MIN_ANGLE && model.radius >= 40) {
      const label = svgEl("text", {
        class: "slice-label",
        x: d.labelX,
        y: d.labelY,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        fill: readableTextColor(d.fill),
      });
      label.textContent = d.pctText;
      g.appendChild(label);
    }

    g.style.cursor = "pointer";
    g.style.transition = transition;
    g.addEventListener("mouseenter", (e) => ia.onEnter(d, e));
    g.addEventListener("mouseleave", (e) => ia.onLeave(e));
    g.addEventListener("click", (e) => ia.onClick(d, e));
    root.appendChild(g);
  }

  parent.appendChild(root);
}
