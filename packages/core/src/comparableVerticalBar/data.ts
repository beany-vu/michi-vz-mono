// ComparableVerticalBar data pipeline (pure): disabled filter, optional top-N,
// category (label) list, y-domain spanning zero (columns diverge from 0).
// Mirrors comparableBar/data.ts with x/y swapped (the value axis is y here).
import type { ComparableBarDataPoint, ComparableVerticalBarChartProps } from "../types";

export interface ProcessComparableVerticalOptions {
  disabledItems?: string[];
  filter?: ComparableVerticalBarChartProps["filter"];
  yAxisDomain?: [number, number];
  /** Force a symmetric domain [-M, M], M = max(|min|, |max|), so 0 sits centred and
   * the negative/positive sides mirror. Wins over yAxisDomain. */
  symmetric?: boolean;
}

export interface ProcessedComparableVertical {
  points: ComparableBarDataPoint[];
  labels: string[];
  yAxisDomain: [number, number];
}

export function processComparableVerticalBarData(
  dataSet: ComparableBarDataPoint[],
  opts: ProcessComparableVerticalOptions
): ProcessedComparableVertical {
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

  let yAxisDomain: [number, number];
  if (opts.symmetric) {
    const m = Math.max(Math.abs(lo), Math.abs(hi)) || 1;
    yAxisDomain = [-m, m];
  } else {
    yAxisDomain = opts.yAxisDomain ?? [lo, hi || 1];
  }

  return {
    points,
    labels: points.map((d) => d.label),
    yAxisDomain,
  };
}
