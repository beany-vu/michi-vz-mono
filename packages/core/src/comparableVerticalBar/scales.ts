// ComparableVerticalBar scales: band x (categories) + linear y (values, spans 0).
import { scaleLinear, scaleBand } from "d3-scale";
import type { ScaleLinear, ScaleBand } from "d3-scale";
import type { Margin } from "../types";

export interface ComparableVerticalScales {
  xScale: ScaleBand<string>;
  yScale: ScaleLinear<number, number>;
}

// Ported from legacy sdg-trade BarchartVertical/Chart.js: `scaleBand()...
// .paddingInner(0.2)` with the (default) paddingOuter left at 0 - columns sit
// flush against the plot's left/right edges, unlike the padded band scales
// used elsewhere in this house (e.g. comparableBar's y-band uses combined
// `.padding(0.3)`).
const PADDING_INNER = 0.2;
const PADDING_OUTER = 0;

export function createComparableVerticalBarScales(
  labels: string[],
  yDomain: [number, number],
  width: number,
  height: number,
  margin: Margin,
  maxBarWidth?: number
): ComparableVerticalScales {
  const yScale = scaleLinear()
    .domain(yDomain)
    .range([height - margin.bottom, margin.top])
    .nice();

  const plotLeft = margin.left;
  const plotRight = width - margin.right;

  // `maxBarWidth` caps each column's thickness: if the natural bandwidth would
  // exceed it, shrink the band range to the size that yields exactly
  // maxBarWidth and CENTRE it in the plot (symmetric whitespace) - mirrors
  // comparableBar's `maxBarHeight` cap, formula adjusted for
  // paddingInner=0.2/paddingOuter=0 (d3 scaleBand: step = size/(n - pInner +
  // 2*pOuter), bandwidth = step * (1 - pInner)).
  let bandRange: [number, number] = [plotLeft, plotRight];
  if (maxBarWidth && maxBarWidth > 0 && labels.length > 0) {
    const fullSize = plotRight - plotLeft;
    const denom = labels.length - PADDING_INNER + 2 * PADDING_OUTER;
    const naturalBandwidth = (fullSize * (1 - PADDING_INNER)) / denom;
    if (naturalBandwidth > maxBarWidth) {
      const neededSize = (maxBarWidth * denom) / (1 - PADDING_INNER);
      const mid = (plotLeft + plotRight) / 2;
      bandRange = [mid - neededSize / 2, mid + neededSize / 2];
    }
  }

  const xScale = scaleBand<string>()
    .domain(labels)
    .range(bandRange)
    .paddingInner(PADDING_INNER)
    .paddingOuter(PADDING_OUTER);

  return { xScale, yScale };
}
