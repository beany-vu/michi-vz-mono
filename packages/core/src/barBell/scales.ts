// BarBell scales: band y (dates) + linear x (cumulative key totals).
import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import type { Margin } from "../types";

export interface BarBellScales {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleBand<string>;
}

export function createBarBellScales(
  dates: string[],
  xDomain: [number, number],
  width: number,
  height: number,
  margin: Margin
): BarBellScales {
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([margin.left, width - margin.right])
    .nice();
  const yScale = scaleBand<string>()
    .domain(dates)
    .range([margin.top, height - margin.bottom])
    .padding(0.4);
  return { xScale, yScale };
}
