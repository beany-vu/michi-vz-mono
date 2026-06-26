// RibbonChart scales: band x (dates) + linear y (stacked totals).
import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import type { Margin } from "../types";

export interface RibbonScales {
  xScale: ScaleBand<string>;
  yScale: ScaleLinear<number, number>;
}

export function createRibbonScales(
  dates: string[],
  yDomain: [number, number],
  width: number,
  height: number,
  margin: Margin
): RibbonScales {
  const xScale = scaleBand<string>()
    .domain(dates)
    .range([margin.left, width - margin.right])
    .padding(0.1);
  const yScale = scaleLinear()
    .domain(yDomain)
    .range([height - margin.bottom, margin.top])
    .nice();
  return { xScale, yScale };
}
