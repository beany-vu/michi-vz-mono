// RangeChart data pipeline (pure): disabled filter + x/y domains over
// valueMin/valueMax across all series.
import { parseXValue } from "../lineChart/lineUtils";
import type { RangeDataItem, XaxisDataType } from "../types";

export interface ProcessRangeOptions {
  disabledItems?: string[];
  xAxisDataType: XaxisDataType;
  yAxisDomain?: [number, number];
}

export interface ProcessedRange {
  items: RangeDataItem[];
  xAxisDomain: [number, number];
  yAxisDomain: [number, number];
}

export function processRangeData(
  dataSet: RangeDataItem[],
  opts: ProcessRangeOptions
): ProcessedRange {
  const disabled = new Set(opts.disabledItems ?? []);
  const items = dataSet.filter((it) => !disabled.has(it.label));

  let xlo = Infinity;
  let xhi = -Infinity;
  let ylo = Infinity;
  let yhi = -Infinity;
  for (const it of items) {
    for (const p of it.series) {
      const v = parseXValue(p.date, opts.xAxisDataType);
      const n = typeof v === "number" ? v : v.getTime();
      if (!Number.isNaN(n)) {
        if (n < xlo) xlo = n;
        if (n > xhi) xhi = n;
      }
      for (const val of [p.valueMin, p.valueMax]) {
        if (Number.isFinite(val)) {
          if (val < ylo) ylo = val;
          if (val > yhi) yhi = val;
        }
      }
    }
  }
  if (!Number.isFinite(xlo)) {
    xlo = 0;
    xhi = 1;
  }
  if (!Number.isFinite(ylo)) {
    ylo = 0;
    yhi = 1;
  }

  return {
    items,
    xAxisDomain: [xlo, xhi],
    yAxisDomain: opts.yAxisDomain ?? [ylo, yhi],
  };
}
