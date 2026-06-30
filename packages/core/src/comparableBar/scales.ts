// ComparableHorizontalBar scales: linear x (values, spans 0) + band y (labels).
import { scaleLinear, scaleBand } from "d3-scale";
import type { ScaleLinear, ScaleBand } from "d3-scale";
import type { Margin } from "../types";

export interface ComparableScales {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleBand<string>;
}

export interface ComparablePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function createComparableBarScales(
  xDomain: [number, number],
  labels: string[],
  width: number,
  height: number,
  margin: Margin,
  padding: ComparablePadding = { top: 0, right: 0, bottom: 0, left: 0 }
): ComparableScales {
  // padding.left/right inset the PLOT (bars + value axis) without moving the y-axis
  // labels (anchored to margin.left) — opens a left column for the label chips.
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([margin.left + padding.left, width - margin.right - padding.right])
    .nice();

  const yScale = scaleBand<string>()
    .domain(labels)
    .range([margin.top, height - margin.bottom])
    .padding(0.3);

  return { xScale, yScale };
}
