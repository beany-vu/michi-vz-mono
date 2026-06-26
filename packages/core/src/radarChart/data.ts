// RadarChart data pipeline (pure): disabled filter + max value across all axes.
import type { RadarDataItem } from "../types";

export interface ProcessedRadar {
  items: RadarDataItem[];
  maxValue: number;
}

export function processRadarData(
  series: RadarDataItem[],
  disabledItems?: string[],
  maxValue?: number
): ProcessedRadar {
  const disabled = new Set(disabledItems ?? []);
  const items = series.filter((it) => !disabled.has(it.label));

  let max = 0;
  for (const it of items) {
    for (const v of it.values) if (Number.isFinite(v) && v > max) max = v;
  }

  return { items, maxValue: maxValue ?? (max || 1) };
}
