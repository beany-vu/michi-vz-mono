// Imperative SVG renderer for FountainChart. Branches on the jet model's style:
//  - "jet": a faint spray-curtain wedge, a droplet field, and the bright column
//           (the column carries data-label-safe so consumer CSS colours it).
//  - "plume": the mist skirt, graduated-opacity froth slices, a dashed forecast
//           outline, and droplet arcs.
// The optional trend line sits behind everything. Ink marks use the
// --michi-vz-ink token so they follow the consumer's theme.
import { svgEl } from "../dom";
import type { FountainJetModel, FountainRenderModel } from "./renderModel";

export interface FountainSvgOptions {
  enableTransitions: boolean;
}

export interface FountainInteractions {
  onEnter: (jet: FountainJetModel, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (jet: FountainJetModel, ev: MouseEvent) => void;
}

const INK = "var(--michi-vz-ink, currentColor)";

export function renderFountainSvg(
  parent: SVGElement,
  model: FountainRenderModel,
  o: FountainSvgOptions,
  ia: FountainInteractions
): void {
  const root = svgEl("g", { class: "fountain-chart-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  if (model.trendLinePath) {
    root.appendChild(
      svgEl("path", {
        class: "mv-fountain-trend",
        d: model.trendLinePath,
        fill: "none",
        stroke: INK,
        "stroke-width": 1.5,
        opacity: 0.45,
      })
    );
  }

  for (const jet of model.jets) {
    const g = svgEl("g", {
      class: "mv-fountain-jet-group",
      "data-label": jet.label,
      "data-label-safe": jet.safe,
    });
    g.style.cursor = "pointer";

    // mist skirt (plume only; null for jet)
    if (jet.mistPath) {
      const mist = svgEl("path", {
        class: "mv-fountain-mist",
        "data-label": jet.label,
        "data-label-safe": jet.safe,
        d: jet.mistPath,
        fill: jet.color,
        opacity: (jet.dimmed ? 0.3 : 1) * 0.1,
      });
      mist.style.transition = transition;
      g.appendChild(mist);
    }
    // the fraying column itself: graduated-opacity froth slices
    jet.slicePaths.forEach((path, i) => {
      const p = svgEl("path", {
        class: "mv-fountain-jet",
        "data-label": jet.label,
        "data-label-safe": jet.safe,
        d: path,
        fill: jet.color,
        opacity: jet.sliceOpacities[i],
      });
      p.style.transition = transition;
      g.appendChild(p);
    });
    if (jet.predicted) {
      g.appendChild(
        svgEl("path", {
          class: "mv-fountain-outline",
          d: jet.outlinePath,
          fill: "none",
          stroke: jet.color,
          "stroke-width": 1,
          "stroke-dasharray": "4,4",
          opacity: jet.dimmed ? 0.3 : 0.8,
        })
      );
    }
    for (const dp of jet.dropletPaths) {
      g.appendChild(
        svgEl("path", {
          class: "mv-fountain-droplet",
          d: dp,
          fill: "none",
          stroke: jet.color,
          "stroke-width": 1.2,
          "stroke-linecap": "round",
          opacity: (jet.dimmed ? 0.3 : 1) * 0.45,
        })
      );
    }

    g.addEventListener("mouseenter", (e) => ia.onEnter(jet, e));
    g.addEventListener("mouseleave", (e) => ia.onLeave(e));
    g.addEventListener("click", (e) => ia.onClick(jet, e));
    root.appendChild(g);
  }

  parent.appendChild(root);
}
