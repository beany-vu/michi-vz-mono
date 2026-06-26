// VerticalStackBar scales: band x (dates) + linear y (stacked totals).
import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import type { Margin } from "../types";

export interface StackScales {
  xScale: ScaleBand<string>;
  yScale: ScaleLinear<number, number>;
}

export function createStackScales(
  dates: string[],
  yDomain: [number, number],
  width: number,
  height: number,
  margin: Margin
): StackScales {
  const xScale = scaleBand<string>()
    .domain(dates)
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const yScale = scaleLinear()
    .domain(yDomain)
    .range([height - margin.bottom, margin.top])
    .clamp(true)
    .nice();

  return { xScale, yScale };
}
