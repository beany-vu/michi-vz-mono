// Ported from michi-vz src/components/hooks/gapChart/useGapChartScales.ts.
// Granular d3 imports (d3-scale only) keep the bundle tree-shakeable.
import { scaleLinear, scaleTime, scaleBand } from "d3-scale";
import type { ScaleLinear, ScaleTime, ScaleBand } from "d3-scale";
import type { Margin, XaxisDataType } from "../types";

export type GapXScale = ScaleLinear<number, number> | ScaleTime<number, number>;

export interface GapScales {
  xScale: GapXScale;
  yScale: ScaleBand<string>;
}

const BAND_PADDING = 0.3;

export function createGapScales(
  xAxisDomain: [number, number],
  yAxisDomain: string[],
  width: number,
  height: number,
  margin: Margin,
  xAxisDataType: XaxisDataType,
  // Derived domains get d3 nice() rounding; an EXPLICIT consumer domain must be
  // honoured exactly (nice() would re-expand a deliberate zoom back toward 0).
  nice = true,
  // Caps each row's thickness so 1-2 rows don't stretch across the full plot
  // height; mirrors ComparableBarChart's createComparableBarScales verbatim.
  maxBarHeight?: number,
): GapScales {
  let xScale: GapXScale;
  if (xAxisDataType === "number") {
    xScale = scaleLinear()
      .domain(xAxisDomain)
      .range([margin.left, width - margin.right]);
    if (nice) (xScale as ScaleLinear<number, number>).nice();
  } else if (xAxisDataType === "date_annual") {
    const [min, max] = xAxisDomain;
    xScale = scaleTime()
      .domain([new Date(min, 0, 1), new Date(max, 0, 1)])
      .range([margin.left, width - margin.right]);
  } else {
    const [min, max] = xAxisDomain;
    xScale = scaleTime()
      .domain([new Date(min), new Date(max)])
      .range([margin.left, width - margin.right]);
  }

  const plotTop = margin.top;
  const plotBottom = height - margin.bottom;
  let bandRange: [number, number] = [plotTop, plotBottom];
  if (maxBarHeight && maxBarHeight > 0 && yAxisDomain.length > 0) {
    const fullSize = plotBottom - plotTop;
    // d3 scaleBand: bandwidth = size * (1 - p) / (n + p) with paddingInner=paddingOuter=p.
    const naturalBandwidth = (fullSize * (1 - BAND_PADDING)) / (yAxisDomain.length + BAND_PADDING);
    if (naturalBandwidth > maxBarHeight) {
      const neededSize = (maxBarHeight * (yAxisDomain.length + BAND_PADDING)) / (1 - BAND_PADDING);
      const mid = (plotTop + plotBottom) / 2;
      bandRange = [mid - neededSize / 2, mid + neededSize / 2];
    }
  }

  const yScale = scaleBand<string>().domain(yAxisDomain).range(bandRange).padding(BAND_PADDING);

  return { xScale, yScale };
}
