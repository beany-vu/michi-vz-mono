// Imperative port of shared/YaxisLinear.tsx - linear (numeric) y-axis: horizontal
// grid line + right-aligned label per tick, ticks from the scale's own .ticks().
// Used by value-axis charts (LineChart, AreaChart, …); band charts use
// renderYAxisBand instead.
import { svgEl } from "../../dom";
import type { ScaleLinear, ScaleLogarithmic } from "d3-scale";
import type { Margin } from "../../types";

// Mirrors xAxisLinear.ts's LinearOrTimeScale: a chart-agnostic local alias (this
// render layer stays decoupled from any one chart's pure-layer types) covering the
// two y-scale kinds a value axis can be built with (LineChart's log mode being the
// only current source of the log branch).
export type LinearOrLogScale = ScaleLinear<number, number> | ScaleLogarithmic<number, number>;

export interface YAxisLinearOptions {
  width: number;
  height: number;
  margin: Margin;
  format: (d: number) => string;
  ticks?: number;
  showGrid?: boolean;
  /** Emphasise the y=0 grid line with a darker solid stroke (default false). */
  highlightZeroLine?: boolean;
}

export function renderYAxisLinear(
  parent: SVGElement,
  scale: LinearOrLogScale,
  o: YAxisLinearOptions
): SVGGElement {
  const g = svgEl("g", { class: "mv-y-axis mv-y-axis-linear" });
  const showGrid = o.showGrid !== false;
  const left = o.margin.left;
  const right = o.width - o.margin.right;

  for (const v of scale.ticks(o.ticks ?? 5)) {
    const py = scale(v);
    if (!Number.isFinite(py)) continue;

    if (showGrid) {
      const isZero = v === 0 && o.highlightZeroLine;
      g.appendChild(
        svgEl("line", {
          class: isZero ? "mv-grid mv-zero-line" : "mv-grid",
          x1: left,
          x2: right,
          y1: py,
          y2: py,
        })
      );
    }

    const label = svgEl("text", {
      class: "mv-axis-label",
      x: left - 8,
      y: py,
      "text-anchor": "end",
      "dominant-baseline": "middle",
    });
    label.textContent = o.format(v);
    g.appendChild(label);
  }

  parent.appendChild(g);
  return g;
}
