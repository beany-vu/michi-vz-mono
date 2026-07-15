// Imperative SVG renderer for ComparableHorizontalBar: two <rect class="bar"> per
// label (based behind at valueBasedOpacity, compared in front at
// valueComparedOpacity), each with data-label + data-label-safe. Hover per group.
import { svgEl } from "../dom";
import { comparableDrawOrder } from "./renderModel";
import type { ComparableBarModel, ComparableRenderModel } from "./renderModel";

export interface ComparableSvgOptions {
  valueBasedOpacity: number;
  valueComparedOpacity: number;
  enableTransitions: boolean;
  /** label (or its data-label-safe form) -> a `<pattern>` element id already
   * present in the SVG's `<defs>` (see render/svg/patternDefs.ts, backported
   * from ComparableVerticalBarChart). When set for a label, its value-based
   * sub-bar fills with `url(#id)` instead of a flat colour - the SVG-mode
   * equivalent of the canvas renderer's patternsMapping tiling. */
  patternIdFor?: (label: string, safe: string) => string | undefined;
}

export interface ComparableInteractions {
  onEnter: (bar: ComparableBarModel, ev: MouseEvent, type: "based" | "compared") => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (bar: ComparableBarModel, ev: MouseEvent, type: "based" | "compared") => void;
}

export function renderComparableSvg(
  parent: SVGElement,
  model: ComparableRenderModel,
  o: ComparableSvgOptions,
  ia: ComparableInteractions,
): void {
  const root = svgEl("g", { class: "comparable-bar-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  for (const bar of model.bars) {
    const g = svgEl("g", {
      class: "data-group",
      "data-label": bar.label,
      "data-label-safe": bar.safe,
    });
    g.style.opacity = bar.dimmed ? "0.3" : "1";
    g.style.transition = transition;

    for (const type of comparableDrawOrder(bar)) {
      const part =
        type === "based"
          ? {
              seg: bar.based,
              opacity: o.valueBasedOpacity,
              cls: "value-based",
              fill: bar.basedColor,
            }
          : {
              seg: bar.compared,
              opacity: o.valueComparedOpacity,
              cls: "value-compared",
              fill: bar.color,
            };
      const patternId = type === "based" ? o.patternIdFor?.(bar.label, bar.safe) : undefined;
      const rect = svgEl("rect", {
        class: `bar ${part.cls}`,
        "data-label": bar.label,
        "data-label-safe": bar.safe,
        x: part.seg.x,
        y: part.seg.y,
        width: part.seg.width,
        height: part.seg.height,
        fill: patternId ? `url(#${patternId})` : part.fill,
        opacity: part.opacity,
        rx: 5,
        ry: 5,
        "stroke-width": 1,
      });
      rect.style.cursor = "pointer";
      rect.addEventListener("mouseenter", (e) => ia.onEnter(bar, e, type));
      rect.addEventListener("mouseleave", (e) => ia.onLeave(e));
      rect.addEventListener("click", (e) => ia.onClick(bar, e, type));
      g.appendChild(rect);
    }
    root.appendChild(g);
  }

  parent.appendChild(root);
}
