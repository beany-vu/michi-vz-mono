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
  /** Offset (px) added to each label's foreignObject x/y (consumer alignment). */
  tickLabelOffset?: { x: number; y: number };
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
  // Default the label gutter to the chart's left margin (min 100), so a chart that
  // reserves a wide left margin (e.g. BarBell's 180 for "MM-YYYY | label" rows) gets
  // a label box wide enough to fit its labels instead of clipping at a fixed 100.
  const tickHtmlWidth = o.tickHtmlWidth ?? Math.max(100, o.margin.left);
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

    // Span the full band height so a wrapped multi-line label fits the row; the
    // flex-centered div keeps the text at the band centre (same as before), so any
    // tickLabelOffset still nudges from centre.
    const fo = svgEl("foreignObject", {
      class: "mv-ylabel-fo",
      x: o.margin.left - tickHtmlWidth + (o.tickLabelOffset?.x ?? 0),
      y: (scale(label) ?? center - bandwidth / 2) + (o.tickLabelOffset?.y ?? 0),
      width: tickHtmlWidth,
      height: bandwidth,
    });
    const div = htmlEl("div", { class: "mv-ylabel", title: label });
    // Text in a <span> so a consumer's legacy `.tick-html span` rules (nowrap +
    // ellipsis) can reattach; charts without that CSS render the span transparently.
    const span = htmlEl("span");
    span.textContent = format(label);
    div.appendChild(span);
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
