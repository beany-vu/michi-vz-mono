// Ported from useLineChartXscale / useLineChartYscale (the useMemo shells dropped).
// Granular d3-scale imports only.
import { scaleLinear, scaleTime } from "d3-scale";
import type { ScaleLinear, ScaleTime } from "d3-scale";
import type { Margin, XaxisDataType } from "../types";

export type LineXScale = ScaleLinear<number, number> | ScaleTime<number, number>;

export interface LineScales {
  xScale: LineXScale;
  yScale: ScaleLinear<number, number>;
}

export function createLineScales(
  xDomain: [number, number],
  yDomain: [number, number],
  width: number,
  height: number,
  margin: Margin,
  xAxisDataType: XaxisDataType
): LineScales {
  const [xlo, xhi] = xDomain;
  let xScale: LineXScale;
  if (xAxisDataType === "number") {
    xScale = scaleLinear()
      .domain([xlo || 0, xhi || 1])
      .range([margin.left, width - margin.right])
      .clamp(true)
      .nice();
  } else {
    // lo/hi are epoch ms (0/1 for empty), matching the legacy new Date(min||0).
    xScale = scaleTime()
      .domain([new Date(xlo), new Date(xhi)])
      .range([margin.left, width - margin.right]);
  }

  const yScale = scaleLinear()
    .domain([yDomain[0] || 0, yDomain[1] || 1])
    .range([height - margin.bottom, margin.top])
    .clamp(true)
    .nice();

  return { xScale, yScale };
}
