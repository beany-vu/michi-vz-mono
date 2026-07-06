// Imperative SVG renderer for RadialTree. One `<path class="radial-tree-link">`
// per node (a cubic bezier from the node to its parent - the dendrogram's radial
// spokes), one `<g class="radial-tree-node">` per node holding its sized
// `<circle class="radial-tree-node-circle">` (the colour-contract mark) and an
// adaptive `<text>` label, plus an optional centre circle + word-wrapped title.
import { svgEl } from "../dom";
import type { RadialTreeMark, RadialTreeRenderModel } from "./renderModel";

export interface RadialTreeSvgOptions {
  enableTransitions: boolean;
}

export interface RadialTreeInteractions {
  onEnter: (mark: RadialTreeMark, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (mark: RadialTreeMark, ev: MouseEvent) => void;
}

function linkPath(m: RadialTreeMark): string {
  const { start, c1, c2, end } = m.link;
  return `M${start[0]},${start[1]}C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${end[0]},${end[1]}`;
}

export function renderRadialTreeSvg(
  parent: SVGElement,
  model: RadialTreeRenderModel,
  o: RadialTreeSvgOptions,
  ia: RadialTreeInteractions
): void {
  const root = svgEl("g", { class: "radial-tree-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  const linksG = svgEl("g", { class: "radial-tree-links" });
  for (const m of model.marks) {
    linksG.appendChild(
      svgEl("path", {
        class: "radial-tree-link",
        d: linkPath(m),
        opacity: m.dimmed ? 0.15 : 0.4,
      })
    );
  }
  root.appendChild(linksG);

  const nodesG = svgEl("g", { class: "radial-tree-nodes" });
  for (const m of model.marks) {
    const g = svgEl("g", { class: "radial-tree-node" });
    g.style.opacity = m.dimmed ? "0.3" : "1";
    g.style.transition = transition;
    g.style.cursor = "pointer";

    if (m.labelText) {
      const text = svgEl("text", {
        class: "radial-tree-label",
        x: `${m.offsetXEm}em`,
        y: `${m.offsetYEm}em`,
        transform: `translate(${m.x}, ${m.y}) rotate(${m.rotateDeg})`,
        "text-anchor": m.textAnchor,
      });
      const name = svgEl("tspan", { class: "radial-tree-label-name" });
      name.textContent = m.labelText;
      text.appendChild(name);
      if (m.valueText) {
        const value = svgEl("tspan");
        value.textContent = ` ${m.valueText}`;
        text.appendChild(value);
      }
      g.appendChild(text);
    }

    g.appendChild(
      svgEl("circle", {
        class: "radial-tree-node-circle",
        "data-label": m.colorKey,
        "data-label-safe": m.dataLabelSafe,
        "data-node-safe": m.nodeSafe,
        cx: m.x,
        cy: m.y,
        r: m.markRadius,
        fill: m.fill,
        opacity: 0.5,
      })
    );

    g.addEventListener("mouseenter", (e) => ia.onEnter(m, e));
    g.addEventListener("mouseleave", (e) => ia.onLeave(e));
    g.addEventListener("click", (e) => ia.onClick(m, e));
    nodesG.appendChild(g);
  }
  root.appendChild(nodesG);

  if (model.centerRadius > 0) {
    root.appendChild(
      svgEl("circle", {
        class: "radial-tree-center-circle",
        cx: 0,
        cy: 0,
        r: model.centerRadius,
        fill: "var(--michi-vz-surface, #ffffff)",
      })
    );
  }
  if (model.centerLines.length > 0) {
    const centerText = svgEl("text", {
      class: "radial-tree-center-label",
      x: 0,
      y: 0,
      "text-anchor": "middle",
      fill: "var(--michi-vz-ink, currentColor)",
    });
    for (const line of model.centerLines) {
      const tspan = svgEl("tspan", { x: 0, y: 0, dy: line.dy });
      tspan.textContent = line.text;
      centerText.appendChild(tspan);
    }
    root.appendChild(centerText);
  }

  parent.appendChild(root);
}
