// RadarChart data pipeline (pure): disabled filter + max value across all axes.
import { tickStep } from "d3-array";
import type { RadarDataItem } from "../types";

export interface ProcessedRadar {
  items: RadarDataItem[];
  maxValue: number;
}

/**
 * Round a radar's outer ring up to the last "nice" tick of `[0, dataMax]`:
 * `Math.ceil(dataMax / step) * step`, with `step = tickStep(0, dataMax, tickCount)`
 * from d3-array (the same 1/2/5 x 10^n steps d3 axes use). 73 with 4 ticks -> 80,
 * 1 234 567 with 4 -> 1 400 000, 0.0037 with 4 -> 0.004; a max already on a tick
 * stays put (100 with 4 -> 100).
 *
 * Returns `dataMax` unchanged when it is not a positive finite number (0, negative,
 * NaN, Infinity) so the caller keeps its own fallback, and when the step is not a
 * positive finite number (a tickCount of 0, negative or NaN).
 */
export function niceRadarMax(dataMax: number, tickCount: number): number {
  if (!(Number.isFinite(dataMax) && dataMax > 0)) return dataMax;
  const step = tickStep(0, dataMax, tickCount);
  if (!(Number.isFinite(step) && step > 0)) return dataMax;
  return Math.ceil(dataMax / step) * step;
}

/**
 * `niceTickCount` (optional): round the outer ring up with `niceRadarMax` using that
 * many ticks. Ignored when `maxValue` is set (an explicit max always wins) and when
 * no value is positive (the default outer ring of 1 stays).
 */
export function processRadarData(
  series: RadarDataItem[],
  disabledItems?: string[],
  maxValue?: number,
  niceTickCount?: number,
): ProcessedRadar {
  const disabled = new Set(disabledItems ?? []);
  const items = series.filter((it) => !disabled.has(it.label));

  let max = 0;
  for (const it of items) {
    for (const v of it.values) if (v != null && Number.isFinite(v) && v > max) max = v;
  }

  if (niceTickCount !== undefined && max > 0) max = niceRadarMax(max, niceTickCount);

  return { items, maxValue: maxValue ?? (max || 1) };
}
