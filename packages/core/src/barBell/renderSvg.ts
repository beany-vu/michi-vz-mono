// Imperative SVG renderer for BarBell: per cumulative segment a thin
// <rect class="bar"> + an end-cap <circle class="bar-bell-cap">, both carrying
// data-label(key) + data-label-safe. Hover per segment → highlight the key.
import { svgEl } from "../dom";
import type { BarBellRenderModel, BarBellSegment } from "./renderModel";

export interface BarBellSvgOptions {
  enableTransitions: boolean;
}

export interface BarBellInteractions {
  onEnter: (seg: BarBellSegment, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (seg: BarBellSegment, ev: MouseEvent) => void;
}

export function renderBarBellSvg(
  parent: SVGElement,
  model: BarBellRenderModel,
  o: BarBellSvgOptions,
  ia: BarBellInteractions
): void {
  const root = svgEl("g", { class: "bar-bell-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  // Two passes so the end-cap circles paint ON TOP of every bar. Segments are
  // adjacent/cumulative, so a later segment's bar would otherwise cover the
  // previous segment's cap.
  for (const seg of model.segments) {
    if (seg.width <= 0) continue;
    const bar = svgEl("rect", {
      class: "bar",
      "data-label": seg.key,
      "data-label-safe": seg.safe,
      x: seg.x,
      y: seg.cy - model.barHeight / 2,
      width: seg.width,
      height: model.barHeight,
      fill: seg.color,
      opacity: seg.dimmed ? 0.15 : 1,
      rx: model.barHeight / 2,
      ry: model.barHeight / 2,
    });
    bar.style.transition = transition;
    bar.style.cursor = "pointer";
    bar.addEventListener("mouseenter", (e) => ia.onEnter(seg, e));
    bar.addEventListener("mouseleave", (e) => ia.onLeave(e));
    bar.addEventListener("click", (e) => ia.onClick(seg, e));
    root.appendChild(bar);
  }

  for (const seg of model.segments) {
    const cap = svgEl("circle", {
      class: "bar-bell-cap",
      "data-label": seg.key,
      "data-label-safe": seg.safe,
      cx: seg.cx,
      cy: seg.cy,
      r: model.capRadius,
      fill: seg.color,
      stroke: "#fff",
      "stroke-width": 1.5,
      opacity: seg.dimmed ? 0.15 : 1,
    });
    cap.style.cursor = "pointer";
    cap.style.transition = transition;
    cap.addEventListener("mouseenter", (e) => ia.onEnter(seg, e));
    cap.addEventListener("mouseleave", (e) => ia.onLeave(e));
    cap.addEventListener("click", (e) => ia.onClick(seg, e));
    root.appendChild(cap);
  }

  parent.appendChild(root);
}
