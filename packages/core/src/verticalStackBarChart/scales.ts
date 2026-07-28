// VerticalStackBar scales: band x (dates) + linear y (stacked totals), plus the
// transposed pair for layout="horizontal" (band y + linear x).
import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import type { Margin } from "../types";

export interface StackScales {
  xScale: ScaleBand<string>;
  yScale: ScaleLinear<number, number>;
}

export interface HorizontalStackScales {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleBand<string>;
}

/** layout="horizontal": categories on a band y-axis, stacked totals on a linear
 *  x-axis growing rightward. The value domain is the SAME one computeYDomain
 *  derives - only the axis it maps to changes. */
export function createHorizontalStackScales(
  dates: string[],
  valueDomain: [number, number],
  width: number,
  height: number,
  margin: Margin,
): HorizontalStackScales {
  const yScale = scaleBand<string>()
    .domain(dates)
    .range([margin.top, height - margin.bottom])
    .padding(0.1);

  const xScale = scaleLinear()
    .domain(valueDomain)
    .range([margin.left, width - margin.right])
    .clamp(true)
    .nice();

  return { xScale, yScale };
}

export function createStackScales(
  dates: string[],
  yDomain: [number, number],
  width: number,
  height: number,
  margin: Margin,
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
