// Ported from useLineChartXscale / useLineChartYscale (the useMemo shells dropped).
// Granular d3-scale imports only.
import { scaleLinear, scaleLog, scaleTime } from "d3-scale";
import type { ScaleLinear, ScaleLogarithmic, ScaleTime } from "d3-scale";
import type { Margin, XaxisDataType } from "../types";

export type LineXScale = ScaleLinear<number, number> | ScaleTime<number, number>;
// "log" backs `yAxisScale: "log"` (LineChart only - FanChart/RangeChart never pass a
// yAxisScale, so their yScale is always the ScaleLinear branch at runtime).
export type LineYScale = ScaleLinear<number, number> | ScaleLogarithmic<number, number>;

export interface LineScales {
  xScale: LineXScale;
  yScale: LineYScale;
}

export function createLineScales(
  xDomain: [number, number],
  yDomain: [number, number],
  width: number,
  height: number,
  margin: Margin,
  xAxisDataType: XaxisDataType,
  yAxisScale?: "linear" | "log"
): LineScales {
  const [xlo, xhi] = xDomain;
  let xScale: LineXScale;
  if (xAxisDataType === "number") {
    xScale = scaleLinear()
      .domain([xlo || 0, xhi || 1])
      .range([margin.left, width - margin.right])
      .clamp(true)
      .nice();
  } else {
    // lo/hi are epoch ms (0/1 for empty), matching the legacy new Date(min||0).
    xScale = scaleTime()
      .domain([new Date(xlo), new Date(xhi)])
      .range([margin.left, width - margin.right]);
  }

  // Non-positive values are undefined on a log scale (Math.log of value <= 0 is NaN or
  // -Infinity). The caller (processLineChartData) has already dropped them when
  // yAxisScale is "log", so yDomain only ever holds positive numbers here - EXCEPT the
  // degenerate all-dropped case, which the engine short-circuits to the no-data state
  // (this scale is built but never actually sampled then). The `|| 1` fallback keeps
  // construction itself crash-free either way.
  const yScale: LineYScale =
    yAxisScale === "log"
      ? scaleLog()
          .base(10)
          .domain([yDomain[0] || 1, yDomain[1] || 1])
          .range([height - margin.bottom, margin.top])
          .clamp(true)
          .nice()
      : scaleLinear()
          .domain([yDomain[0] || 0, yDomain[1] || 1])
          .range([height - margin.bottom, margin.top])
          .clamp(true)
          .nice();

  return { xScale, yScale };
}
