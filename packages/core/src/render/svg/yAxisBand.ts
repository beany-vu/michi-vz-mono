// Imperative port of shared/YaxisBand.tsx — band-scale y-axis with HTML labels
// (via <foreignObject>, so long labels ellipsize and stay hoverable) plus a
// full-width dashed grid line per band. Optional hover wiring + dim, matching the
// legacy component's `onHover`/`hoveredItem` behaviour (no-hover guard is
// `hoveredItem === null`, so omitting it leaves all labels at full opacity).
//
// Generalized from the GapChart-local axis so every band-based chart shares one.
import { svgEl, htmlEl } from "../../dom";
import type { ScaleBand } from "d3-scale";
import type { Margin } from "../../types";

export interface YAxisBandOptions {
  width: number;
  margin: Margin;
  /** Formats a band label (default identity). */
  format?: (label: string) => string;
  tickHtmlWidth?: number;
  showGrid?: boolean;
  hideTickLabels?: boolean;
  /** Hover callbacks (e.g. cross-highlight). Omit to disable. */
  onHover?: (label: string | null) => void;
  /** Currently hovered band; null = no hover (all labels full opacity). */
  hoveredItem?: string | null;
}

export function renderYAxisBand(
  parent: SVGElement,
  scale: ScaleBand<string>,
  o: YAxisBandOptions
): SVGGElement {
  const g = svgEl("g", { class: "mv-y-axis" });
  const format = o.format ?? ((l: string) => l);
  const tickHtmlWidth = o.tickHtmlWidth ?? 100;
  const bandwidth = scale.bandwidth();
  const gridRight = o.width - o.margin.right;
  const hovered = o.hoveredItem ?? null;

  for (const label of scale.domain()) {
    const center = (scale(label) || 0) + bandwidth / 2;

    g.appendChild(
      svgEl("line", {
        class: "mv-grid",
        x1: o.margin.left,
        x2: gridRight,
        y1: center,
        y2: center,
        stroke: o.showGrid ? undefined : "transparent",
      })
    );

    if (o.hideTickLabels) continue;

    const fo = svgEl("foreignObject", {
      class: "mv-ylabel-fo",
      x: o.margin.left - tickHtmlWidth,
      y: center - 10,
      width: tickHtmlWidth,
      height: 20,
    });
    const div = htmlEl("div", { class: "mv-ylabel", title: label });
    div.textContent = format(label);
    // Dim non-hovered labels (legacy: 0.3 when another band is hovered).
    div.style.opacity = hovered === null || hovered === label ? "1" : "0.3";
    if (o.onHover) {
      div.addEventListener("mouseenter", () => o.onHover?.(label));
      div.addEventListener("mouseleave", () => o.onHover?.(null));
    }
    fo.appendChild(div);
    g.appendChild(fo);
  }

  parent.appendChild(g);
  return g;
}
