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

/** Distance (px) from the axis line to a rotated label's anchor point. */
export const ROTATED_LABEL_OFFSET = 14;
/** Baseline (px below the axis line) of a horizontal label. */
export const HORIZONTAL_LABEL_OFFSET = 20;

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
  /**
   * Extra px to drop the labels by, in BOTH modes. Use it when the caller already draws
   * something in the row directly under the axis line and the tick labels would land on
   * top of it (VerticalStackBar's series-abbreviation letters). Default 0 = legacy
   * spacing, so every other caller is unaffected.
   */
  labelOffset?: number;
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
  const drop = o.labelOffset ?? 0;

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
        transform: `translate(0, ${ROTATED_LABEL_OFFSET + drop}) rotate(-45)`,
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
        y: bottom + HORIZONTAL_LABEL_OFFSET + drop,
        "text-anchor": "middle",
      });
      text.textContent = format(label);
      g.appendChild(text);
    }
  }

  parent.appendChild(g);
  return g;
}
