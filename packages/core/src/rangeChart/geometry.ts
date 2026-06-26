// RangeChart geometry: a band area (y0=valueMin, y1=valueMax) + an optional
// median line per series. Reuses Line's x parser + curve factory.
import { area as d3area, line as d3line } from "d3-shape";
import { resolveCurveFactory } from "../lineChart/curve";
import { parseXValue } from "../lineChart/lineUtils";
import type { CurveType, RangeDataPoint, XaxisDataType } from "../types";
import type { LineXScale } from "../lineChart/scales";
import type { ScaleLinear } from "d3-scale";

function projectX(d: RangeDataPoint, xScale: LineXScale, t: XaxisDataType): number {
  const v = parseXValue(d.date, t);
  return (xScale as (x: number | Date) => number)(v);
}

export function makeRangeAreaGenerator(
  xScale: LineXScale,
  yScale: ScaleLinear<number, number>,
  xAxisDataType: XaxisDataType,
  curve?: CurveType
): (points: RangeDataPoint[]) => string | null {
  const gen = d3area<RangeDataPoint>()
    .x((d) => projectX(d, xScale, xAxisDataType))
    .y0((d) => yScale(d.valueMin))
    .y1((d) => yScale(d.valueMax))
    .curve(resolveCurveFactory(curve));
  return (points) => gen(points);
}

export function makeRangeMedianGenerator(
  xScale: LineXScale,
  yScale: ScaleLinear<number, number>,
  xAxisDataType: XaxisDataType,
  curve?: CurveType
): (points: RangeDataPoint[]) => string | null {
  const gen = d3line<RangeDataPoint>()
    .x((d) => projectX(d, xScale, xAxisDataType))
    .y((d) => yScale(d.valueMedium ?? (d.valueMin + d.valueMax) / 2))
    .curve(resolveCurveFactory(curve));
  return (points) => gen(points);
}
