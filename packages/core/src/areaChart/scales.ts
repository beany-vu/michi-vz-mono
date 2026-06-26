// AreaChart scales: same x as LineChart (linear/time), but y is a fixed
// [0, stackedMax] (or [0,100]) value axis, not auto-fit.
import { scaleLinear, scaleTime } from "d3-scale";
import type { ScaleLinear, ScaleTime } from "d3-scale";
import type { Margin, XaxisDataType } from "../types";

export type AreaXScale = ScaleLinear<number, number> | ScaleTime<number, number>;

export interface AreaScales {
  xScale: AreaXScale;
  yScale: ScaleLinear<number, number>;
}

export function createAreaScales(
  xDomain: [number, number],
  yDomain: [number, number],
  width: number,
  height: number,
  margin: Margin,
  xAxisDataType: XaxisDataType,
  forcePercentageScale = false
): AreaScales {
  const [xlo, xhi] = xDomain;
  let xScale: AreaXScale;
  if (xAxisDataType === "number") {
    xScale = scaleLinear()
      .domain([xlo || 0, xhi || 1])
      .range([margin.left, width - margin.right])
      .clamp(true)
      .nice();
  } else {
    xScale = scaleTime()
      .domain([new Date(xlo), new Date(xhi)])
      .range([margin.left, width - margin.right]);
  }

  const yScale = scaleLinear()
    .domain(yDomain)
    .range([height - margin.bottom, margin.top])
    .clamp(true);
  if (!forcePercentageScale) yScale.nice();

  return { xScale, yScale };
}
