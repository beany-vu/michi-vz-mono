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

const BAND_PADDING = 0.3;

export function createComparableBarScales(
  xDomain: [number, number],
  labels: string[],
  width: number,
  height: number,
  margin: Margin,
  padding: ComparablePadding = { top: 0, right: 0, bottom: 0, left: 0 },
  maxBarHeight?: number
): ComparableScales {
  // padding.left/right inset the PLOT (bars + value axis) without moving the y-axis
  // labels (anchored to margin.left) — opens a left column for the label chips.
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([margin.left + padding.left, width - margin.right - padding.right])
    .nice();

  // The band scale stretches a few bars over the full plot height, ballooning the bar
  // thickness when there are only 1-2 rows. `maxBarHeight` caps each bar's thickness:
  // if the natural bandwidth would exceed it, shrink the band range to the size that
  // yields exactly maxBarHeight and CENTRE it in the plot (symmetric whitespace), so
  // few-row charts read tidily instead of as giant blocks. No-op for dense charts.
  const plotTop = margin.top;
  const plotBottom = height - margin.bottom;
  let bandRange: [number, number] = [plotTop, plotBottom];
  if (maxBarHeight && maxBarHeight > 0 && labels.length > 0) {
    const fullSize = plotBottom - plotTop;
    // d3 scaleBand: bandwidth = size * (1 - p) / (n + p) with paddingInner=paddingOuter=p.
    const naturalBandwidth = (fullSize * (1 - BAND_PADDING)) / (labels.length + BAND_PADDING);
    if (naturalBandwidth > maxBarHeight) {
      const neededSize = (maxBarHeight * (labels.length + BAND_PADDING)) / (1 - BAND_PADDING);
      const mid = (plotTop + plotBottom) / 2;
      bandRange = [mid - neededSize / 2, mid + neededSize / 2];
    }
  }

  const yScale = scaleBand<string>().domain(labels).range(bandRange).padding(BAND_PADDING);

  return { xScale, yScale };
}
