// AreaChart geometry: the d3.area generator (x, y0, y1, curve) producing the
// stacked-area path string, plus the top-edge line (area.lineY1()) the overlapping
// mode strokes. Reuses LineChart's curve factory + x parser.
import { area as d3area } from "d3-shape";
import { resolveCurveFactory } from "../lineChart/curve";
import { parseXValue } from "../lineChart/lineUtils";
import type { CurveType, XaxisDataType } from "../types";
import type { AreaStackedPoint } from "./data";
import type { AreaXScale } from "./scales";
import type { ScaleLinear } from "d3-scale";

export function areaProjectX(
  row: { date: number | string },
  xScale: AreaXScale,
  t: XaxisDataType,
): number {
  const v = parseXValue(row.date, t);
  return (xScale as (x: number | Date) => number)(v);
}

function d3AreaFor(
  xScale: AreaXScale,
  yScale: ScaleLinear<number, number>,
  xAxisDataType: XaxisDataType,
  curve?: CurveType,
) {
  return d3area<AreaStackedPoint>()
    .defined(() => true)
    .x((d) => areaProjectX(d.data, xScale, xAxisDataType))
    .y0((d) => yScale(d[0] || 0))
    .y1((d) => yScale(d[1] || 0))
    .curve(resolveCurveFactory(curve));
}

export function makeAreaGenerator(
  xScale: AreaXScale,
  yScale: ScaleLinear<number, number>,
  xAxisDataType: XaxisDataType,
  curve?: CurveType,
): (values: AreaStackedPoint[]) => string | null {
  const gen = d3AreaFor(xScale, yScale, xAxisDataType, curve);
  return (values: AreaStackedPoint[]) => gen(values);
}

/** The line along an area's TOP edge (x, y1) with the same curve, so the stroke sits
 * exactly on the fill's upper boundary. */
export function makeAreaTopLineGenerator(
  xScale: AreaXScale,
  yScale: ScaleLinear<number, number>,
  xAxisDataType: XaxisDataType,
  curve?: CurveType,
): (values: AreaStackedPoint[]) => string | null {
  const gen = d3AreaFor(xScale, yScale, xAxisDataType, curve).lineY1();
  return (values: AreaStackedPoint[]) => gen(values);
}
