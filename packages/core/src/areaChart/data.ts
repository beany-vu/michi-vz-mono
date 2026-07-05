// AreaChart data pipeline: d3.stack over the active keys, plus x/y domains.
// activeKeys = keys minus disabledItems (disabling reflows the stack, matching
// the legacy chart). Pure.
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
}

export interface ProcessedArea {
  activeKeys: string[];
  stacked: AreaDatum[];
  xAxisDomain: [number, number];
  yAxisDomain: [number, number];
}

export function processAreaChartData(
  series: AreaDataRow[],
  opts: ProcessAreaOptions
): ProcessedArea {
  const disabled = new Set(opts.disabledItems ?? []);
  const activeKeys = opts.keys.filter((k) => !disabled.has(k));

  const gen = d3stack<AreaDataRow, string>()
    .keys(activeKeys)
    .value((d, key) => Number(d[key]) || 0);
  if (opts.stackOffset === "expand") gen.offset(stackOffsetExpand);
  const layers = gen(series);
  const stacked: AreaDatum[] = layers.map((layer, i) => ({
    key: activeKeys[i],
    values: layer.map((p) => ({ 0: p[0], 1: p[1], data: p.data })),
  }));

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
        : opts.yAxisDomain ?? [0, Math.max(100, maxSum)];

  return { activeKeys, stacked, xAxisDomain: [xlo, xhi], yAxisDomain };
}
