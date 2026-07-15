// Imperative band (categorical) x-axis: one centered label per band at the
// bottom. Used by bar-family charts (VerticalStackBar, …). Value-axis charts use
// renderXAxisLinear instead.
//
// Dense-axis handling (ported from legacy michi-vz XaxisBand): when the caller
// passes `mode`/`tickValues` (computed via chooseAxisMode), labels can be thinned
// to a subset and tilted -45° ("rotated") so monthly/daily series don't overlap.
// Callers that omit them get the unchanged horizontal-all-labels behaviour.
import { svgEl } from "../../dom";
import type { ScaleBand } from "d3-scale";
import type { Margin } from "../../types";
import type { AxisMode } from "./chooseAxisMode";

export interface XAxisBandOptions {
  width: number;
  height: number;
  margin: Margin;
  format?: (label: string) => string;
  showGrid?: boolean;
  /** Layout mode from chooseAxisMode; "rotated" tilts labels -45°. Default horizontal. */
  mode?: AxisMode;
  /** Subset of bands to label (thinning). Omit to label every band. */
  tickValues?: string[];
}

export function renderXAxisBand(
  parent: SVGElement,
  scale: ScaleBand<string>,
  o: XAxisBandOptions,
): SVGGElement {
  const g = svgEl("g", { class: "mv-x-axis mv-x-axis-band" });
  const bottom = o.height - o.margin.bottom;
  const top = o.margin.top;
  const bw = scale.bandwidth();
  const format = o.format ?? ((l: string) => l);
  const rotated = o.mode === "rotated";
  const labelSet = o.tickValues ? new Set(o.tickValues) : null;

  for (const label of scale.domain()) {
    const cx = (scale(label) ?? 0) + bw / 2;
    if (o.showGrid) {
      g.appendChild(svgEl("line", { class: "mv-grid", x1: cx, x2: cx, y1: top, y2: bottom }));
    }
    if (labelSet && !labelSet.has(label)) continue; // thinning

    if (rotated) {
      // Mirror the legacy d3 output: tick group on the axis line, text pushed
      // below the line then tilted -45°, anchored at its end so it trails
      // down-left from the tick (abbreviation → gap → rotated label).
      const tickG = svgEl("g", { class: "mv-tick", transform: `translate(${cx}, ${bottom})` });
      const text = svgEl("text", {
        class: "mv-axis-label",
        y: 0,
        transform: "translate(0, 14) rotate(-45)",
        "text-anchor": "end",
        dy: "0.32em",
      });
      text.textContent = format(label);
      tickG.appendChild(text);
      g.appendChild(tickG);
    } else {
      const text = svgEl("text", {
        class: "mv-axis-label",
        x: cx,
        y: bottom + 20,
        "text-anchor": "middle",
      });
      text.textContent = format(label);
      g.appendChild(text);
    }
  }

  parent.appendChild(g);
  return g;
}
