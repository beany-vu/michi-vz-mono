// BarBell data pipeline (pure): active keys, date band, cumulative x-domain.
import type { BarBellDataRow } from "../types";

export interface ProcessedBarBell {
  activeKeys: string[];
  dates: string[];
  xAxisDomain: [number, number];
}

export function processBarBellData(
  dataSet: BarBellDataRow[],
  keys: string[],
  disabledItems?: string[],
  xAxisDomain?: [number, number]
): ProcessedBarBell {
  const disabled = new Set(disabledItems ?? []);
  const activeKeys = keys.filter((k) => !disabled.has(k));
  const dates = dataSet.map((d) => String(d.date));

  let maxCumulative = 0;
  for (const row of dataSet) {
    let sum = 0;
    for (const k of activeKeys) sum += Number(row[k]) || 0;
    if (sum > maxCumulative) maxCumulative = sum;
  }

  return { activeKeys, dates, xAxisDomain: xAxisDomain ?? [0, maxCumulative || 1] };
}
