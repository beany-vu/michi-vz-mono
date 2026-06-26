// ComparableHorizontalBar data pipeline (pure): disabled filter, optional top-N,
// label list, x-domain spanning zero (bars diverge from 0).
import type { ComparableBarDataPoint, ComparableBarChartProps } from "../types";

export interface ProcessComparableOptions {
  disabledItems?: string[];
  filter?: ComparableBarChartProps["filter"];
  xAxisDomain?: [number, number];
}

export interface ProcessedComparable {
  points: ComparableBarDataPoint[];
  labels: string[];
  xAxisDomain: [number, number];
}

export function processComparableBarData(
  dataSet: ComparableBarDataPoint[],
  opts: ProcessComparableOptions
): ProcessedComparable {
  const disabled = new Set(opts.disabledItems ?? []);
  let points = dataSet.filter((d) => !disabled.has(d.label));

  if (opts.filter) {
    const { criteria, sortingDir, limit } = opts.filter;
    const dir = sortingDir === "asc" ? 1 : -1;
    points = [...points].sort((a, b) => dir * (a[criteria] - b[criteria])).slice(0, limit);
  }

  let lo = 0;
  let hi = 0;
  for (const d of points) {
    for (const v of [d.valueBased, d.valueCompared]) {
      if (Number.isFinite(v)) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
  }

  return {
    points,
    labels: points.map((d) => d.label),
    xAxisDomain: opts.xAxisDomain ?? [lo, hi || 1],
  };
}
