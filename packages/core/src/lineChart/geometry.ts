// Ported from useLineChartGeometry (getRuns + the d3-line generator). Pure: takes
// scales + data, returns run splits and SVG/canvas path strings. No React.
import { line as d3line } from "d3-shape";
import type { CurveFactory } from "d3-shape";
import { resolveCurveFactory } from "./curve";
import { parseXValue } from "./lineUtils";
import type { CurveType, DataPoint, XaxisDataType } from "../types";
import type { LineXScale, LineYScale } from "./scales";

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

// Records the drawing commands a d3 curve emits for the FULL series - one
// command per data interval (all supported CurveType factories emit exactly
// moveTo + (n-1) segment commands for n >= 2 points). Slicing those commands
// back into certainty runs keeps a gap (dashed) run on the SAME curve the
// whole line follows. Generating each run independently degenerates a 2-point
// gap run to a straight segment (curveMonotoneX/curveLinear through 2 points
// is a line), which is why dashed missing-data bridges used to render straight
// while the solid runs around them curved.
// Match d3-shape's serializer (d3.path with digits=3) so the sliced paths are
// byte-compatible with what the per-run d3 generator used to emit.
const fmt = (v: number): number => Math.round(v * 1000) / 1000;

class SegmentRecorder {
  segments: string[] = [];
  moveTo(_x: number, _y: number): void {}
  lineTo(x: number, y: number): void {
    this.segments.push(`L${fmt(x)},${fmt(y)}`);
  }
  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void {
    this.segments.push(`C${fmt(x1)},${fmt(y1)},${fmt(x2)},${fmt(y2)},${fmt(x)},${fmt(y)}`);
  }
  quadraticCurveTo(x1: number, y1: number, x: number, y: number): void {
    this.segments.push(`Q${fmt(x1)},${fmt(y1)},${fmt(x)},${fmt(y)}`);
  }
  closePath(): void {}
}

// Per-run SVG path strings sliced from ONE full-series curve, so solid and
// dashed runs share identical geometry and joint tangents. Falls back to
// independent per-run generation for degenerate input (single point, or a
// curve that doesn't map 1 command : 1 interval).
export function buildSeriesRunPaths(
  series: DataPoint[],
  runs: SeriesRun[],
  xScale: LineXScale,
  yScale: LineYScale,
  xAxisDataType: XaxisDataType,
  curve?: CurveType,
): string[] {
  const gen = makeLineGenerator(xScale, yScale, xAxisDataType, curve);
  if (series.length < 2) return runs.map((run) => gen(run.points) ?? "");

  const rec = new SegmentRecorder();
  d3line<DataPoint>()
    .x((d) => projectX(d, xScale, xAxisDataType))
    .y((d) => yScale(d.value))
    .curve(resolveCurveFactory(curve))
    .context(rec as unknown as CanvasRenderingContext2D)(series);

  if (rec.segments.length !== series.length - 1) {
    return runs.map((run) => gen(run.points) ?? "");
  }

  let start = 0; // series index of the run's first point (runs share boundaries)
  return runs.map((run) => {
    const p0 = run.points[0];
    const head = `M${fmt(projectX(p0, xScale, xAxisDataType))},${fmt(yScale(p0.value))}`;
    const count = run.points.length - 1;
    const d = head + rec.segments.slice(start, start + count).join("");
    start += count;
    return d;
  });
}

// Build a reusable d3-line generator (SVG path string for an array of points).
export function makeLineGenerator(
  xScale: LineXScale,
  yScale: LineYScale,
  xAxisDataType: XaxisDataType,
  curve?: CurveType,
): (points: DataPoint[]) => string | null {
  const factory: CurveFactory = resolveCurveFactory(curve);
  const gen = d3line<DataPoint>()
    .x((d) => projectX(d, xScale, xAxisDataType))
    .y((d) => yScale(d.value))
    .curve(factory);
  return (points: DataPoint[]) => gen(points);
}
