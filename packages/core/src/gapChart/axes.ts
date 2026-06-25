// Imperative axis builders — port of the shared XaxisLinear / YaxisBand React
// components to framework-agnostic D3-less DOM builders. Faithful to the numeric
// tick logic (evenly spaced, first/last/zero included) and the band Y labels
// (HTML labels via foreignObject + dashed grid lines).
import { svgEl, htmlEl } from "../dom";
import type { Margin, XaxisDataType } from "../types";
import type { GapXScale } from "./scales";
import type { ScaleBand, ScaleTime } from "d3-scale";

export interface XAxisOptions {
  width: number;
  height: number;
  margin: Margin;
  xAxisDataType: XaxisDataType;
  format: (d: number) => string;
  ticks: number;
  tickValues?: Array<number | Date>;
  enableExplicitTickValues: boolean;
}

// Numeric values passed to the formatter (number itself, or epoch ms for dates).
function numericTickValues(scale: GapXScale, o: XAxisOptions): number[] {
  if (o.enableExplicitTickValues && o.tickValues && o.tickValues.length > 0) {
    return o.tickValues.map((v) => (v instanceof Date ? v.valueOf() : v));
  }
  const target = Math.min(5, o.ticks);
  if (o.xAxisDataType !== "number") {
    return (scale as ScaleTime<number, number>).ticks(target).map((d) => d.valueOf());
  }
  const [first, last] = scale.domain() as [number, number];
  if (target <= 2) return [first, last];
  const out: number[] = [];
  const start = first === 0 ? 0 : first;
  out.push(start);
  const step = (last - first) / (target - 1);
  for (let i = 1; i < target - 1; i++) out.push(first + i * step);
  out.push(last);
  return out;
}

export function renderXAxis(parent: SVGElement, scale: GapXScale, o: XAxisOptions): void {
  const g = svgEl("g", { class: "mv-x-axis" });
  const top = o.margin.top;
  const bottom = o.height - o.margin.bottom;
  const values = numericTickValues(scale, o);

  for (const v of values) {
    const px = o.xAxisDataType === "number" ? (scale(v) as number) : (scale(new Date(v)) as number);
    if (!Number.isFinite(px)) continue;
    const isZero = o.xAxisDataType === "number" && v === 0;

    const grid = svgEl("line", {
      class: "mv-grid",
      x1: px,
      x2: px,
      y1: top,
      y2: bottom,
      "stroke-dasharray": isZero ? "none" : undefined,
    });
    if (isZero) grid.setAttribute("stroke-dasharray", "none");
    g.appendChild(grid);

    g.appendChild(
      svgEl("circle", { class: "mv-tick-dot", cx: px, cy: bottom + 8, r: 2, fill: "lightgray" })
    );

    const label = svgEl("text", {
      class: "mv-axis-label",
      x: px,
      y: bottom + 26,
      "text-anchor": "middle",
    });
    label.textContent = o.format(v);
    g.appendChild(label);
  }
  parent.appendChild(g);
}

export interface YAxisOptions {
  width: number;
  margin: Margin;
  format: (label: string) => string;
  tickHtmlWidth: number;
  showGrid: boolean;
}

export function renderYAxis(parent: SVGElement, scale: ScaleBand<string>, o: YAxisOptions): void {
  const g = svgEl("g", { class: "mv-y-axis" });
  const bandwidth = scale.bandwidth();
  const gridRight = o.width - o.margin.right;

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

    const fo = svgEl("foreignObject", {
      class: "mv-ylabel-fo",
      x: o.margin.left - o.tickHtmlWidth,
      y: center - 10,
      width: o.tickHtmlWidth,
      height: 20,
    });
    const div = htmlEl("div", { class: "mv-ylabel", title: label });
    div.textContent = o.format(label);
    fo.appendChild(div);
    g.appendChild(fo);
  }
  parent.appendChild(g);
}
