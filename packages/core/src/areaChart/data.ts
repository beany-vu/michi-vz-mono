// AreaChart data pipeline: d3.stack over the active keys (or, with stacked:false,
// one baseline-to-value area per key), plus x/y domains. activeKeys = keys minus
// disabledItems (disabling reflows the stack, matching the legacy chart). Pure.
import { stack as d3stack, stackOffsetExpand } from "d3-shape";
import { parseXValue } from "../lineChart/lineUtils";
import type { AreaDataRow, XaxisDataType } from "../types";

export interface AreaStackedPoint {
  0: number;
  1: number;
  data: AreaDataRow;
}

export interface AreaDatum {
  key: string;
  values: AreaStackedPoint[];
}

export interface ProcessAreaOptions {
  keys: string[];
  disabledItems?: string[];
  xAxisDataType: XaxisDataType;
  yAxisDomain?: [number, number];
  forcePercentageScale?: boolean;
  /** "expand" normalizes each x-slice to sum to 1 via d3-shape's stackOffsetExpand
   * (which itself guards the divide-by-zero case, leaving zero-total slices at 0
   * rather than NaN). Default "none" - today's absolute stacking. */
  stackOffset?: "none" | "expand";
  /** false = OVERLAPPING areas: each key runs from 0 to its own value (no
   * accumulation), `stackOffset` is ignored, the y domain is the largest single
   * value and the layers come back in DRAW order (largest mean first). Default true. */
  stacked?: boolean;
}

export interface ProcessedArea {
  activeKeys: string[];
  /** One layer per active key. Stacked: bottom-to-top in keys order. Overlapping
   * (stacked:false): DRAW order, largest mean first, so smaller areas paint on top. */
  stacked: AreaDatum[];
  xAxisDomain: [number, number];
  yAxisDomain: [number, number];
}

export function processAreaChartData(
  series: AreaDataRow[],
  opts: ProcessAreaOptions,
): ProcessedArea {
  const disabled = new Set(opts.disabledItems ?? []);
  const activeKeys = opts.keys.filter((k) => !disabled.has(k));
  const overlap = opts.stacked === false;

  let stacked: AreaDatum[];
  if (overlap) {
    // Same {0, 1, data} shape as a stack layer, so the render model, the hit rows
    // and the context builder need no second code path.
    stacked = overlapDrawOrder(series, activeKeys).map((key) => ({
      key,
      values: series.map((row) => ({ 0: 0, 1: Number(row[key]) || 0, data: row })),
    }));
  } else {
    const gen = d3stack<AreaDataRow, string>()
      .keys(activeKeys)
      .value((d, key) => Number(d[key]) || 0);
    if (opts.stackOffset === "expand") gen.offset(stackOffsetExpand);
    const layers = gen(series);
    stacked = layers.map((layer, i) => ({
      key: activeKeys[i],
      values: layer.map((p) => ({ 0: p[0], 1: p[1], data: p.data })),
    }));
  }

  // x domain (numbers; epoch ms for date types)
  let xlo = Infinity;
  let xhi = -Infinity;
  for (const row of series) {
    const v = parseXValue(row.date, opts.xAxisDataType);
    const n = typeof v === "number" ? v : v.getTime();
    if (Number.isNaN(n)) continue;
    if (n < xlo) xlo = n;
    if (n > xhi) xhi = n;
  }
  if (xlo === Infinity) {
    xlo = 0;
    xhi = 1;
  }

  if (overlap) {
    // Overlapping: the tallest single area sets the scale. No floor at 100 (shares
    // like 0.9 would be squashed flat) and no expand; an all-zero chart gets [0, 1]
    // rather than a collapsed [0, 0] domain.
    let maxValue = 0;
    for (const row of series) {
      for (const k of activeKeys) {
        const v = Number(row[k]);
        if (Number.isFinite(v) && v > maxValue) maxValue = v;
      }
    }
    const yAxisDomain: [number, number] = opts.forcePercentageScale
      ? [0, 100]
      : (opts.yAxisDomain ?? [0, maxValue > 0 ? maxValue : 1]);
    return { activeKeys, stacked, xAxisDomain: [xlo, xhi], yAxisDomain };
  }

  // y domain: max stacked sum over active keys (legacy floors the max at 100).
  let maxSum = 0;
  for (const row of series) {
    let s = 0;
    for (const k of activeKeys) s += Number(row[k]) || 0;
    if (s > maxSum) maxSum = s;
  }
  // expand normalizes every slice to sum to 1, so the y domain is always [0,1] -
  // it wins over forcePercentageScale/yAxisDomain (an absolute-scale request makes
  // no sense once the values themselves are fractions).
  const yAxisDomain: [number, number] =
    opts.stackOffset === "expand"
      ? [0, 1]
      : opts.forcePercentageScale
        ? [0, 100]
        : (opts.yAxisDomain ?? [0, Math.max(100, maxSum)]);

  return { activeKeys, stacked, xAxisDomain: [xlo, xhi], yAxisDomain };
}

/** Draw order for OVERLAPPING areas: largest mean first (behind), so a smaller area
 * is painted on top instead of being buried. Ties fall back to the peak, then to the
 * keys order (stable). The mean is over each key's finite values. */
export function overlapDrawOrder(series: AreaDataRow[], keys: string[]): string[] {
  const stats = keys.map((key, index) => {
    let sum = 0;
    let count = 0;
    let peak = -Infinity;
    for (const row of series) {
      const raw = row[key];
      if (raw == null) continue;
      const v = Number(raw);
      if (!Number.isFinite(v)) continue;
      sum += v;
      count++;
      if (v > peak) peak = v;
    }
    return { key, index, mean: count ? sum / count : 0, peak: count ? peak : 0 };
  });
  stats.sort((a, b) => b.mean - a.mean || b.peak - a.peak || a.index - b.index);
  return stats.map((s) => s.key);
}
