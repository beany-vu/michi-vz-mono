// RibbonChart data pipeline (pure): active keys, date band, stacked y-domain.
import type { RibbonDataRow } from "../types";

export interface ProcessedRibbon {
  activeKeys: string[];
  dates: string[];
  yAxisDomain: [number, number];
}

export function processRibbonData(
  series: RibbonDataRow[],
  keys: string[],
  disabledItems?: string[],
  yAxisDomain?: [number, number]
): ProcessedRibbon {
  const disabled = new Set(disabledItems ?? []);
  const activeKeys = keys.filter((k) => !disabled.has(k));
  const dates = series.map((d) => String(d.date));

  let maxSum = 0;
  for (const row of series) {
    let sum = 0;
    for (const k of activeKeys) sum += Number(row[k]) || 0;
    if (sum > maxSum) maxSum = sum;
  }

  return { activeKeys, dates, yAxisDomain: yAxisDomain ?? [0, maxSum || 1] };
}
