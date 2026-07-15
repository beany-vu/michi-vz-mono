// Imperative SVG renderer for Bubble. Each bubble is one <circle class="bubble">
// (data-label + data-label-safe for the colour contract). When split is on, a
// white veil disc covers the whole bubble and a solid realized-core disc is drawn
// on top, so the realized portion reads at full colour inside a lighter ring.
// Highlight dimming (opacity) is computed here, not baked into the model.
import { svgEl } from "../dom";
import { readableTextColor } from "../math/contrast";
import type { BubbleMark, BubbleRenderModel } from "./renderModel";

export interface BubbleSvgOptions {
  enableTransitions: boolean;
}

export interface BubbleInteractions {
  onEnter: (bubble: BubbleMark, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (bubble: BubbleMark, ev: MouseEvent) => void;
}

function fitText(text: string, r: number, charPx = 6.2): string {
  const max = Math.floor((r * 2 - 6) / charPx);
  if (max <= 0) return "";
  if (text.length <= max) return text;
  if (max <= 1) return "";
  return text.slice(0, max - 1) + "…";
}

export function renderBubbleSvg(
  parent: SVGElement,
  model: BubbleRenderModel,
  o: BubbleSvgOptions,
  ia: BubbleInteractions,
): void {
  const root = svgEl("g", { class: "bubble-chart-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";
  const anyHighlight = model.highlightSet.size > 0;
  const veil = Math.max(0, Math.min(0.95, 1 - model.splitOpacity));

  for (const d of model.bubbles) {
    const highlighted = !anyHighlight || model.highlightSet.has(d.label);
    const g = svgEl("g", { class: "bubble-cell", opacity: highlighted ? 1 : 0.2 });

    g.appendChild(
      svgEl("circle", {
        class: "bubble",
        "data-label": d.colorKey,
        "data-label-safe": d.dataLabelSafe,
        cx: d.x,
        cy: d.y,
        r: d.r,
        fill: d.fill,
      }),
    );

    if (model.showSplit && d.partialPct != null && d.realizedRadius < d.r) {
      // White veil over the whole bubble (lightens it), then re-paint the solid
      // realized core on top.
      g.appendChild(
        svgEl("circle", {
          class: "bubble-veil",
          cx: d.x,
          cy: d.y,
          r: d.r,
          fill: "#ffffff",
          opacity: veil,
        }),
      );
      g.appendChild(
        svgEl("circle", {
          class: "bubble-realized",
          "data-label-safe": d.dataLabelSafe,
          cx: d.x,
          cy: d.y,
          r: d.realizedRadius,
          fill: d.fill,
        }),
      );
    }

    if (model.showLabels && d.r >= 16) {
      const label = svgEl("text", {
        class: "bubble-label",
        x: d.x,
        y: d.y,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        fill: readableTextColor(d.fill),
      });
      label.textContent = fitText(d.code ? `${d.code}` : d.label, d.r);
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
