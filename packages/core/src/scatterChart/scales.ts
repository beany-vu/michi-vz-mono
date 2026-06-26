// ScatterPlot scales: x linear/time, y linear, plus a size (radius) scale.
import { scaleLinear, scaleTime } from "d3-scale";
import type { ScaleLinear, ScaleTime } from "d3-scale";
import type { Margin, XaxisDataType } from "../types";

export type ScatterXScale = ScaleLinear<number, number> | ScaleTime<number, number>;

export interface ScatterScales {
  xScale: ScatterXScale;
  yScale: ScaleLinear<number, number>;
  /** Maps a point's `d` value to a pixel radius. */
  sizeScale: ScaleLinear<number, number>;
}

export function createScatterScales(
  xDomain: [number, number],
  yDomain: [number, number],
  dDomain: [number, number],
  width: number,
  height: number,
  margin: Margin,
  xAxisDataType: XaxisDataType,
  sizeRange: [number, number]
): ScatterScales {
  const [xlo, xhi] = xDomain;
  let xScale: ScatterXScale;
  if (xAxisDataType === "number") {
    xScale = scaleLinear()
      .domain([xlo, xhi || 1])
      .range([margin.left, width - margin.right])
      .nice()
      .clamp(true);
  } else {
    xScale = scaleTime()
      .domain([new Date(xlo), new Date(xhi)])
      .range([margin.left, width - margin.right])
      .clamp(true);
  }

  const yScale = scaleLinear()
    .domain([yDomain[0], yDomain[1] || 1])
    .range([height - margin.bottom, margin.top])
    .nice()
    .clamp(true);

  const sizeScale = scaleLinear().domain(dDomain).range(sizeRange).clamp(true);

  return { xScale, yScale, sizeScale };
}
