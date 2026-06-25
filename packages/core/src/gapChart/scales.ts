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

export function createGapScales(
  xAxisDomain: [number, number],
  yAxisDomain: string[],
  width: number,
  height: number,
  margin: Margin,
  xAxisDataType: XaxisDataType
): GapScales {
  let xScale: GapXScale;
  if (xAxisDataType === "number") {
    xScale = scaleLinear()
      .domain(xAxisDomain)
      .range([margin.left, width - margin.right])
      .nice();
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

  const yScale = scaleBand<string>()
    .domain(yAxisDomain)
    .range([margin.top, height - margin.bottom])
    .padding(0.3);

  return { xScale, yScale };
}
