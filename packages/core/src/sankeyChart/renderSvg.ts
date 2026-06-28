// Imperative SVG renderer for Sankey. Link bands are drawn first (under the
// nodes): each is one <path class="link"> (stroke = the colour, width ∝ value)
// with the colour-contract attributes. Nodes are <rect class="node"> with a label
// that flips side based on which half the node sits in. Highlight dimming
// (opacity) is computed here, not baked into the model.
import { svgEl } from "../dom";
import type { SankeyNodeMark, SankeyLinkMark, SankeyRenderModel } from "./renderModel";

export type SankeyHoverTarget =
  | { kind: "node"; node: SankeyNodeMark }
  | { kind: "link"; link: SankeyLinkMark };

export interface SankeySvgOptions {
  enableTransitions: boolean;
}

export interface SankeyInteractions {
  onEnter: (target: SankeyHoverTarget, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (target: SankeyHoverTarget, ev: MouseEvent) => void;
}

export function renderSankeySvg(
  parent: SVGElement,
  model: SankeyRenderModel,
  o: SankeySvgOptions,
  ia: SankeyInteractions
): void {
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";
  const anyHighlight = model.highlightSet.size > 0;

  // ---- Links (under the nodes) ----
  const linksG = svgEl("g", { class: "sankey-links" });
  for (const l of model.links) {
    const lit =
      !anyHighlight || model.highlightSet.has(l.sourceId) || model.highlightSet.has(l.targetId);
    const path = svgEl("path", {
      class: "link",
      "data-label": l.colorKey,
      "data-label-safe": l.dataLabelSafe,
      "data-source": l.sourceId,
      "data-target": l.targetId,
      "data-width": Math.max(1, l.width),
      d: l.d,
      fill: l.color,
      stroke: "none",
      "fill-opacity": lit ? model.linkOpacity : model.linkOpacity * 0.25,
    });
    path.style.transition = transition;
    path.style.cursor = "pointer";
    path.addEventListener("mouseenter", (e) => ia.onEnter({ kind: "link", link: l }, e));
    path.addEventListener("mouseleave", (e) => ia.onLeave(e));
    path.addEventListener("click", (e) => ia.onClick({ kind: "link", link: l }, e));
    linksG.appendChild(path);
  }
  parent.appendChild(linksG);

  // ---- Nodes ----
  const nodesG = svgEl("g", { class: "sankey-nodes" });
  for (const n of model.nodes) {
    const lit = !anyHighlight || model.highlightSet.has(n.id);
    const g = svgEl("g", { class: "sankey-node", opacity: lit ? 1 : 0.25 });
    const radius = Math.min(model.nodeRadius, Math.min(n.w, n.h) / 2);
    g.appendChild(
      svgEl("rect", {
        class: "node",
        "data-label": n.colorKey,
        "data-label-safe": n.dataLabelSafe,
        x: n.x,
        y: n.y,
        width: n.w,
        height: n.h,
        fill: n.fill,
        rx: radius,
        ry: radius,
      })
    );
    if (model.showLabels && n.h >= 6) {
      const label = svgEl("text", {
        class: "node-label",
        x: n.labelLeft ? n.x + n.w + 4 : n.x - 4,
        y: (n.y + (n.y + n.h)) / 2,
        "text-anchor": n.labelLeft ? "start" : "end",
        "dominant-baseline": "central",
        fill: "var(--michi-vz-ink, currentColor)",
      });
      label.textContent = n.label;
      g.appendChild(label);
    }
    g.style.transition = transition;
    g.style.cursor = "pointer";
    g.addEventListener("mouseenter", (e) => ia.onEnter({ kind: "node", node: n }, e));
    g.addEventListener("mouseleave", (e) => ia.onLeave(e));
    g.addEventListener("click", (e) => ia.onClick({ kind: "node", node: n }, e));
    nodesG.appendChild(g);
  }
  parent.appendChild(nodesG);
}
