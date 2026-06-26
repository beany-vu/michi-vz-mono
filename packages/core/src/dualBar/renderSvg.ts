// Imperative SVG renderer for DualHorizontalBar: per label a right bar (value1)
// and left bar (value2), class "bar" + data-label-safe. Hover per group.
import { svgEl } from "../dom";
import type { DualBarModel, DualRenderModel } from "./renderModel";

export interface DualSvgOptions {
  value1Opacity: number;
  value2Opacity: number;
  enableTransitions: boolean;
}

export interface DualInteractions {
  onEnter: (bar: DualBarModel, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (bar: DualBarModel, ev: MouseEvent) => void;
}

export function renderDualSvg(
  parent: SVGElement,
  model: DualRenderModel,
  o: DualSvgOptions,
  ia: DualInteractions
): void {
  const root = svgEl("g", { class: "dual-bar-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  for (const bar of model.bars) {
    const g = svgEl("g", { class: "data-group", "data-label": bar.label, "data-label-safe": bar.safe });
    g.style.opacity = bar.dimmed ? "0.3" : "1";
    g.style.transition = transition;

    for (const part of [
      { seg: bar.bar1, opacity: o.value1Opacity, cls: "value1" },
      { seg: bar.bar2, opacity: o.value2Opacity, cls: "value2" },
    ]) {
      const rect = svgEl("rect", {
        class: `bar ${part.cls}`,
        "data-label": bar.label,
        "data-label-safe": bar.safe,
        x: part.seg.x,
        y: bar.y,
        width: part.seg.width,
        height: bar.height,
        fill: bar.color,
        opacity: part.opacity,
        rx: 3,
        ry: 3,
      });
      rect.style.cursor = "pointer";
      rect.addEventListener("mouseenter", (e) => ia.onEnter(bar, e));
      rect.addEventListener("mouseleave", (e) => ia.onLeave(e));
      rect.addEventListener("click", (e) => ia.onClick(bar, e));
      g.appendChild(rect);
    }
    root.appendChild(g);
  }

  parent.appendChild(root);
}
