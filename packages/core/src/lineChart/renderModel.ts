// Renderer-agnostic LineChart model: one structure consumed by BOTH the SVG and
// canvas renderers (so they can't drift) and the source for buildLineContext.
import { buildSeriesRunPaths, getRuns, projectX } from "./geometry";
import { sanitizeForClassName } from "../math/sanitize";
import type { LineColorResolver } from "./colors";
import type { LineScales } from "./scales";
import type { CurveType, DataPoint, LineDataItem, Shape, XaxisDataType } from "../types";

export interface LineRunModel {
  points: DataPoint[];
  certain: boolean;
  /** SVG path string (also fed to the canvas generator's own context draw). */
  path: string;
}

export interface LinePointModel {
  d: DataPoint;
  x: number;
  y: number;
}

export interface LineSeriesModel {
  label: string;
  safe: string;
  color: string;
  code?: string;
  shape: Shape;
  curve?: CurveType;
  runs: LineRunModel[];
  points: LinePointModel[];
  /** y pixel of the lone point when this is a single-point series, else null. */
  singlePointY: number | null;
  /** dimmed by highlightItems (something else is highlighted). */
  dimmed: boolean;
}

export interface LineRenderModel {
  series: LineSeriesModel[];
}

export interface BuildLineModelOptions {
  xAxisDataType: XaxisDataType;
  curve?: CurveType;
  highlightItems: string[];
}

export function buildLineRenderModel(
  dataSet: LineDataItem[],
  scales: LineScales,
  colors: LineColorResolver,
  o: BuildLineModelOptions,
): LineRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;

  const series: LineSeriesModel[] = dataSet.map((item) => {
    const rawRuns = getRuns(item.series);
    // One full-series curve sliced into per-run paths, so a dashed gap run
    // keeps the same curvature as the solid runs around it (a 2-point run
    // generated on its own is always straight under monotoneX/linear).
    const runPaths = buildSeriesRunPaths(
      item.series,
      rawRuns,
      scales.xScale,
      scales.yScale,
      o.xAxisDataType,
      item.curve ?? o.curve,
    );
    const runs: LineRunModel[] = rawRuns.map((run, i) => ({
      points: run.points,
      certain: run.certain,
      path: runPaths[i] ?? "",
    }));

    const points: LinePointModel[] = item.series.map((d) => ({
      d,
      x: projectX(d, scales.xScale, o.xAxisDataType),
      y: scales.yScale(d.value),
    }));

    const singlePointY = item.series.length === 1 ? scales.yScale(item.series[0].value) : null;

    return {
      label: item.label,
      safe: sanitizeForClassName(item.label),
      color: colors.getColor(item.label),
      code: item.series.find((d) => d.code)?.code,
      shape: item.shape ?? "circle",
      curve: item.curve ?? o.curve,
      runs,
      points,
      singlePointY,
      dimmed: anyHighlight && !highlightSet.has(item.label),
    };
  });

  return { series };
}
