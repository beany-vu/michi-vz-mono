// DualHorizontalBar (tornado) data pipeline (pure): disabled filter, optional
// top-N, label list, x-domain [0, max(value1,value2)].
import type { DualBarChartProps, DualBarDataPoint } from "../types";

export interface ProcessDualOptions {
  disabledItems?: string[];
  filter?: DualBarChartProps["filter"];
  xAxisDomain?: [number, number];
}

export interface ProcessedDual {
  points: DualBarDataPoint[];
  labels: string[];
  xAxisDomain: [number, number];
}

export function processDualBarData(
  dataSet: DualBarDataPoint[],
  opts: ProcessDualOptions
): ProcessedDual {
  const disabled = new Set(opts.disabledItems ?? []);
  let points = dataSet.filter((d) => !disabled.has(d.label));

  if (opts.filter) {
    const { criteria, sortingDir, limit } = opts.filter;
    const dir = sortingDir === "asc" ? 1 : -1;
    points = [...points].sort((a, b) => dir * (a[criteria] - b[criteria])).slice(0, limit);
  }

  let hi = 0;
  for (const d of points) {
    if (Number.isFinite(d.value1) && d.value1 > hi) hi = d.value1;
    if (Number.isFinite(d.value2) && d.value2 > hi) hi = d.value2;
  }

  return { points, labels: points.map((d) => d.label), xAxisDomain: opts.xAxisDomain ?? [0, hi || 1] };
}
