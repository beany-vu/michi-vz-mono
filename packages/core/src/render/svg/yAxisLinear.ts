// Imperative port of shared/YaxisLinear.tsx — linear (numeric) y-axis: horizontal
// grid line + right-aligned label per tick, ticks from the scale's own .ticks().
// Used by value-axis charts (LineChart, AreaChart, …); band charts use
// renderYAxisBand instead.
import { svgEl } from "../../dom";
import type { ScaleLinear } from "d3-scale";
import type { Margin } from "../../types";

export interface YAxisLinearOptions {
  width: number;
  height: number;
  margin: Margin;
  format: (d: number) => string;
  ticks?: number;
  showGrid?: boolean;
}

export function renderYAxisLinear(
  parent: SVGElement,
  scale: ScaleLinear<number, number>,
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
      g.appendChild(
        svgEl("line", { class: "mv-grid", x1: left, x2: right, y1: py, y2: py })
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
