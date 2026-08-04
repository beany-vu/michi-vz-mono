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
  /** The ranked top-N slice BEFORE disabledItems were removed — present only when
   * `filter` is set. Feeds renderedRankedIds so hiding a ranked column via the
   * legend never re-ranks/backfills the emitted set. */
  rankedPoints?: ComparableBarDataPoint[];
}

export function processComparableVerticalBarData(
  dataSet: ComparableBarDataPoint[],
  opts: ProcessComparableVerticalOptions,
): ProcessedComparableVertical {
  const disabled = new Set(opts.disabledItems ?? []);

  // Rank/slice the FULL set first (a hidden column keeps its ranked slot —
  // hiding is view-level, it must not let the (limit+1)-th item backfill)...
  let rankedPoints: ComparableBarDataPoint[] | undefined;
  if (opts.filter) {
    const { criteria, sortingDir, limit } = opts.filter;
    const dir = sortingDir === "asc" ? 1 : -1;
    rankedPoints = [...dataSet].sort((a, b) => dir * (a[criteria] - b[criteria])).slice(0, limit);
  }

  // ...then drop disabledItems from what gets DRAWN.
  const points = (rankedPoints ?? dataSet).filter((d) => !disabled.has(d.label));

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
    rankedPoints,
  };
}
