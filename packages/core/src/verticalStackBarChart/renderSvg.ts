// Imperative SVG renderer for VerticalStackBar: one <rect class="bar"> per stacked
// segment (data-label + data-label-safe for the colour contract), plus per-group
// series abbreviation labels. Hover wiring per rect. Highlight dimming computed
// here (opacity), not baked into the model.
import { svgEl } from "../dom";
import { sanitizeForClassName } from "../math/sanitize";
import type { StackRectData } from "../types";
import type { StackRenderModel } from "./renderModel";

export interface StackSvgOptions {
  enableTransitions: boolean;
}

export interface StackInteractions {
  onEnter: (rect: StackRectData, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (rect: StackRectData, ev: MouseEvent) => void;
}

export function renderStackSvg(
  parent: SVGElement,
  model: StackRenderModel,
  o: StackSvgOptions,
  ia: StackInteractions
): void {
  const root = svgEl("g", { class: "stack-chart-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";
  const anyHighlight = model.highlightSet.size > 0;

  for (const key of model.keys) {
    const safe = sanitizeForClassName(key);
    const opacity = !anyHighlight || model.highlightSet.has(key) ? 1 : 0.2;
    for (const d of model.stackedRectData[key] ?? []) {
      const rect = svgEl("rect", {
        class: "bar",
        "data-label": key,
        "data-label-safe": safe,
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
        fill: d.fill,
        stroke: "#fff",
        "stroke-width": 1,
        rx: 2,
        ry: 2,
        opacity,
      });
      rect.style.cursor = "pointer";
      rect.style.transition = transition;
      rect.addEventListener("mouseenter", (e) => ia.onEnter(d, e));
      rect.addEventListener("mouseleave", (e) => ia.onLeave(e));
      rect.addEventListener("click", (e) => ia.onClick(d, e));
      root.appendChild(rect);
    }
  }

  // Series abbreviation labels under each group column.
  for (const lbl of model.abbrevLabels) {
    const text = svgEl("text", {
      class: "mv-stack-abbrev",
      x: lbl.x,
      y: lbl.y,
      "text-anchor": "middle",
      "font-size": 12,
      fill: "#000",
    });
    text.textContent = lbl.text;
    root.appendChild(text);
  }

  parent.appendChild(root);
}
