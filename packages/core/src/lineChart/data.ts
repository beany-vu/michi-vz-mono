// LineChart data pipeline (ported from useFilteredDataSet + gap-detection wiring).
// Order: exclude disabledItems -> optional top-N filter (by value at filter.date)
// -> optional per-series gap detection -> compute x/y domains. Pure.
import { applyGapDetection } from "./detectGaps";
import { getXScaleDomain, getYScaleDomain } from "./lineUtils";
import type { Filter, LineDataItem, XaxisDataType } from "../types";

export interface ProcessLineOptions {
  disabledItems?: string[];
  filter?: Filter;
  detectGaps?: boolean;
  expectedStep?: number;
  xAxisDataType: XaxisDataType;
  yAxisDomain?: [number, number];
  yAxisScale?: "linear" | "log";
}

// A base-10 log scale is undefined for value <= 0 (Math.log of a non-positive number is
// NaN or -Infinity). Shared by processLineChartData's point-dropping below and
// validate/lineWarnings.ts's dropped-count warning, so the two never drift apart.
export function isNonPositiveLogValue(value: number): boolean {
  return value <= 0;
}

export interface ProcessedLine {
  processedDataSet: LineDataItem[];
  visibleLabels: string[];
  xAxisDomain: [number, number];
  yAxisDomain: [number, number];
}

// Value of a series at a specific x (for filter ranking). Missing -> -Infinity so
// it sorts last under desc.
function valueAtDate(item: LineDataItem, date: number | string): number {
  const hit = item.series.find((d) => String(d.date) === String(date));
  return hit ? hit.value : -Infinity;
}

export function processLineChartData(
  dataSet: LineDataItem[],
  opts: ProcessLineOptions
): ProcessedLine {
  const disabled = new Set(opts.disabledItems ?? []);
  let items = dataSet.filter((it) => !disabled.has(it.label));

  if (opts.filter) {
    const { criteria, date, sortingDir, limit } = opts.filter;
    const at = criteria === "value" || !criteria ? date : date;
    const dir = sortingDir === "asc" ? 1 : -1;
    items = [...items]
      .sort((a, b) => dir * (valueAtDate(a, at) - valueAtDate(b, at)))
      .slice(0, limit);
  }

  // Log mode: non-positive points are treated as missing (like any other gap) -
  // dropped BEFORE detectGaps runs, so an existing time-based gap check (when opted
  // in) naturally dashes the segment spanning the hole; the y domain below then only
  // ever sees the remaining positive values.
  const logSafeItems: LineDataItem[] =
    opts.yAxisScale === "log"
      ? items.map((it) => ({
          ...it,
          series: it.series.filter((d) => !isNonPositiveLogValue(d.value)),
        }))
      : items;

  const processedDataSet: LineDataItem[] = opts.detectGaps
    ? logSafeItems.map((it) => ({
        ...it,
        series: applyGapDetection(it.series, opts.xAxisDataType, opts.expectedStep),
      }))
    : logSafeItems;

  const xAxisDomain = getXScaleDomain(processedDataSet, opts.xAxisDataType);
  const yAxisDomain = opts.yAxisDomain ?? getYScaleDomain(processedDataSet);

  return {
    processedDataSet,
    visibleLabels: processedDataSet.map((it) => it.label),
    xAxisDomain,
    yAxisDomain,
  };
}
