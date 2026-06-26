// DualHorizontalBar scales: a centered pair of linear x half-scales (value1 grows
// right, value2 grows left from the centre) + a band y over labels.
import { scaleLinear, scaleBand } from "d3-scale";
import type { ScaleLinear, ScaleBand } from "d3-scale";
import type { Margin } from "../types";

export interface DualScales {
  center: number;
  xScale1: ScaleLinear<number, number>;
  xScale2: ScaleLinear<number, number>;
  yScale: ScaleBand<string>;
}

export function createDualBarScales(
  xDomain: [number, number],
  labels: string[],
  width: number,
  height: number,
  margin: Margin
): DualScales {
  const center = width / 2;
  const xScale1 = scaleLinear().domain(xDomain).range([center, width - margin.right]);
  const xScale2 = scaleLinear().domain(xDomain).range([center, margin.left]);
  const yScale = scaleBand<string>()
    .domain(labels)
    .range([margin.top, height - margin.bottom])
    .padding(0.3);
  return { center, xScale1, xScale2, yScale };
}
