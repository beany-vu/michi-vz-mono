// Ported from useLineChartGeometry (getRuns + the d3-line generator). Pure: takes
// scales + data, returns run splits and SVG/canvas path strings. No React.
import { line as d3line } from "d3-shape";
import type { CurveFactory } from "d3-shape";
import { resolveCurveFactory } from "./curve";
import { parseXValue } from "./lineUtils";
import type { CurveType, DataPoint, XaxisDataType } from "../types";
import type { LineXScale } from "./scales";
import type { ScaleLinear } from "d3-scale";

export interface SeriesRun {
  points: DataPoint[];
  certain: boolean;
}

// Split a series into contiguous runs of same certainty. Each run renders as a
// single <path> with a constant stroke-dasharray (certain = solid, uncertain =
// 4,4 dash). Adjacent runs share their boundary point so the line stays
// continuous. Verbatim from the legacy hook.
export function getRuns(series: DataPoint[]): SeriesRun[] {
  if (!series || series.length === 0) return [];
  if (series.length === 1) return [{ points: [series[0]], certain: true }];

  const runs: SeriesRun[] = [];
  let runStart = 0;
  let runCertain = !!series[1]?.certainty;

  for (let i = 2; i < series.length; i++) {
    const segCertain = !!series[i]?.certainty;
    if (segCertain !== runCertain) {
      runs.push({ points: series.slice(runStart, i), certain: runCertain });
      runStart = i - 1; // share the boundary point
      runCertain = segCertain;
    }
  }
  runs.push({ points: series.slice(runStart), certain: runCertain });
  return runs;
}

// Project a data point onto the pixel x-axis (the value the scale maps).
export function projectX(d: DataPoint, xScale: LineXScale, t: XaxisDataType): number {
  const v = parseXValue(d.date, t);
  // Both ScaleLinear(number) and ScaleTime(Date) accept their domain value.
  return (xScale as (x: number | Date) => number)(v);
}

// Build a reusable d3-line generator (SVG path string for an array of points).
export function makeLineGenerator(
  xScale: LineXScale,
  yScale: ScaleLinear<number, number>,
  xAxisDataType: XaxisDataType,
  curve?: CurveType
): (points: DataPoint[]) => string | null {
  const factory: CurveFactory = resolveCurveFactory(curve);
  const gen = d3line<DataPoint>()
    .x((d) => projectX(d, xScale, xAxisDataType))
    .y((d) => yScale(d.value))
    .curve(factory);
  return (points: DataPoint[]) => gen(points);
}
