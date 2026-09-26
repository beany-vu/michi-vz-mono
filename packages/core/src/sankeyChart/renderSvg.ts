// Imperative SVG renderer for Sankey. Link bands are drawn first (under the
// nodes): each is one <path class="link"> (stroke = the colour, width ∝ value)
// with the colour-contract attributes. Nodes are <rect class="node"> with a label
// that flips side based on which half the node sits in. Highlight dimming
// (opacity) is decided by the shared emphasis.ts helper, not baked into the model;
// a hover emphasis is applied IN PLACE (applySankeySvgEmphasis), never by redrawing.
import { svgEl } from "../dom";
import type { SankeyNodeMark, SankeyLinkMark, SankeyRenderModel } from "./renderModel";
import { sankeyLitState, sankeyLinkAlpha, sankeyNodeAlpha, type SankeyEmphasis } from "./emphasis";

export type SankeyHoverTarget =
  { kind: "node"; node: SankeyNodeMark } | { kind: "link"; link: SankeyLinkMark };

export interface SankeySvgOptions {
  enableTransitions: boolean;
  /** Transient hover emphasis (wins over the model's highlightSet); null/omitted = none. */
  emphasis?: SankeyEmphasis | null;
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
  ia: SankeyInteractions,
): void {
  // Single wrapping group so the engine's opt-in progressive-draw reveal has one
  // <g> to clip (links + nodes together, never the title which lives outside it).
  const root = svgEl("g", { class: "sankey-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";
  // Links dim through fill-opacity, so their transition has to cover it too.
  const linkTransition = o.enableTransitions
    ? "opacity 0.2s ease-in-out, fill-opacity 0.2s ease-in-out"
    : "none";
  const lit = sankeyLitState(model, o.emphasis ?? null);

  // ---- Links (under the nodes) ----
  const linksG = svgEl("g", { class: "sankey-links" });
  for (const l of model.links) {
    const path = svgEl("path", {
      class: "link",
      "data-label": l.colorKey,
      "data-label-safe": l.dataLabelSafe,
      "data-source": l.sourceId,
      "data-target": l.targetId,
      "data-index": l.index,
      "data-width": Math.max(1, l.width),
      d: l.d,
      fill: l.color,
      stroke: "none",
      "fill-opacity": sankeyLinkAlpha(model.linkOpacity, lit.links[l.index]),
    });
    path.style.transition = linkTransition;
    path.style.cursor = "pointer";
    path.addEventListener("mouseenter", (e) => ia.onEnter({ kind: "link", link: l }, e));
    path.addEventListener("mouseleave", (e) => ia.onLeave(e));
    path.addEventListener("click", (e) => ia.onClick({ kind: "link", link: l }, e));
    linksG.appendChild(path);
  }
  root.appendChild(linksG);

  // ---- Nodes ----
  const nodesG = svgEl("g", { class: "sankey-nodes" });
  model.nodes.forEach((n, i) => {
    const g = svgEl("g", {
      class: "sankey-node",
      "data-index": i,
      opacity: sankeyNodeAlpha(lit.nodes[i]),
    });
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
      }),
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
  });
  root.appendChild(nodesG);

  parent.appendChild(root);
}

/**
 * Re-apply the lit/dim state to marks ALREADY drawn from `model` - only the
 * opacity attributes change, so the element under the pointer is never replaced
 * (a redraw would fire mouseleave/mouseenter on it). Marks are matched by their
 * `data-index` (their position in model.links / model.nodes).
 */
export function applySankeySvgEmphasis(
  root: ParentNode,
  model: SankeyRenderModel,
  emphasis: SankeyEmphasis | null,
): void {
  const lit = sankeyLitState(model, emphasis);
  root.querySelectorAll("path.link[data-index]").forEach((el) => {
    const on = lit.links[Number(el.getAttribute("data-index"))];
    if (on !== undefined) {
      el.setAttribute("fill-opacity", String(sankeyLinkAlpha(model.linkOpacity, on)));
    }
  });
  root.querySelectorAll("g.sankey-node[data-index]").forEach((el) => {
    const on = lit.nodes[Number(el.getAttribute("data-index"))];
    if (on !== undefined) el.setAttribute("opacity", String(sankeyNodeAlpha(on)));
  });
}
