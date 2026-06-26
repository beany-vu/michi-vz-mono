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

  const processedDataSet: LineDataItem[] = opts.detectGaps
    ? items.map((it) => ({
        ...it,
        series: applyGapDetection(it.series, opts.xAxisDataType, opts.expectedStep),
      }))
    : items;

  const xAxisDomain = getXScaleDomain(processedDataSet, opts.xAxisDataType);
  const yAxisDomain = opts.yAxisDomain ?? getYScaleDomain(processedDataSet);

  return {
    processedDataSet,
    visibleLabels: processedDataSet.map((it) => it.label),
    xAxisDomain,
    yAxisDomain,
  };
}
