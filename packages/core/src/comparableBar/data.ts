// ComparableHorizontalBar data pipeline (pure): disabled filter, optional top-N,
// label list, x-domain spanning zero (bars diverge from 0).
import type { ComparableBarDataPoint, ComparableBarChartProps } from "../types";

export interface ProcessComparableOptions {
  disabledItems?: string[];
  filter?: ComparableBarChartProps["filter"];
  xAxisDomain?: [number, number];
  /** Force a symmetric domain [-M, M], M = max(|min|, |max|), so 0 sits centred and
   * the negative/positive sides mirror (e.g. growth ±%). Wins over xAxisDomain. */
  symmetric?: boolean;
}

export interface ProcessedComparable {
  points: ComparableBarDataPoint[];
  labels: string[];
  xAxisDomain: [number, number];
  /** The ranked top-N slice BEFORE disabledItems were removed — present only when
   * `filter` is set. Feeds renderedRankedIds so hiding a ranked bar via the
   * legend never re-ranks/backfills the emitted set. */
  rankedPoints?: ComparableBarDataPoint[];
}

export function processComparableBarData(
  dataSet: ComparableBarDataPoint[],
  opts: ProcessComparableOptions,
): ProcessedComparable {
  const disabled = new Set(opts.disabledItems ?? []);

  // Rank/slice the FULL set first (a hidden bar keeps its ranked slot — hiding
  // is view-level, it must not let the (limit+1)-th item backfill)...
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

  let xAxisDomain: [number, number];
  if (opts.symmetric) {
    const m = Math.max(Math.abs(lo), Math.abs(hi)) || 1;
    xAxisDomain = [-m, m];
  } else {
    xAxisDomain = opts.xAxisDomain ?? [lo, hi || 1];
  }

  return {
    points,
    labels: points.map((d) => d.label),
    xAxisDomain,
    rankedPoints,
  };
}
