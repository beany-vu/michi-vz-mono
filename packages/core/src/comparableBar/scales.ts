// ComparableHorizontalBar scales: linear x (values, spans 0) + band y (labels).
import { scaleLinear, scaleBand } from "d3-scale";
import type { ScaleLinear, ScaleBand } from "d3-scale";
import type { Margin } from "../types";

export interface ComparableScales {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleBand<string>;
}

export function createComparableBarScales(
  xDomain: [number, number],
  labels: string[],
  width: number,
  height: number,
  margin: Margin
): ComparableScales {
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([margin.left, width - margin.right])
    .nice();

  const yScale = scaleBand<string>()
    .domain(labels)
    .range([margin.top, height - margin.bottom])
    .padding(0.3);

  return { xScale, yScale };
}
