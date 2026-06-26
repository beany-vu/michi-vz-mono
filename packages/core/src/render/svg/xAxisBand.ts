// Imperative band (categorical) x-axis: one centered label per band at the
// bottom. Used by bar-family charts (VerticalStackBar, …). Value-axis charts use
// renderXAxisLinear instead.
import { svgEl } from "../../dom";
import type { ScaleBand } from "d3-scale";
import type { Margin } from "../../types";

export interface XAxisBandOptions {
  width: number;
  height: number;
  margin: Margin;
  format?: (label: string) => string;
  showGrid?: boolean;
}

export function renderXAxisBand(
  parent: SVGElement,
  scale: ScaleBand<string>,
  o: XAxisBandOptions
): SVGGElement {
  const g = svgEl("g", { class: "mv-x-axis mv-x-axis-band" });
  const bottom = o.height - o.margin.bottom;
  const top = o.margin.top;
  const bw = scale.bandwidth();
  const format = o.format ?? ((l: string) => l);

  for (const label of scale.domain()) {
    const cx = (scale(label) ?? 0) + bw / 2;
    if (o.showGrid) {
      g.appendChild(svgEl("line", { class: "mv-grid", x1: cx, x2: cx, y1: top, y2: bottom }));
    }
    const text = svgEl("text", {
      class: "mv-axis-label",
      x: cx,
      y: bottom + 20,
      "text-anchor": "middle",
    });
    text.textContent = format(label);
    g.appendChild(text);
  }

  parent.appendChild(g);
  return g;
}
