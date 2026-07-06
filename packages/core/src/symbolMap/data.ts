// SymbolMap data pipeline (pure): validates/normalizes dataSet items (coordinate
// + value sanity, disabledItems), keyed for colour resolution by `label` (see
// colors.ts). Two populations matter downstream:
//  - `located`: items with finite, in-range lng/lat - the FULL set used to build
//    the radius/opacity scale domain (scales.ts) and (dot-only mode) the
//    coordinate extent (mirrors legacy MapSymbolForce/Chart.js, whose xScale/
//    yScale domain came from its ENTIRE static coordinate table, independent of
//    which rows were actually visible).
//  - `visible`: `located` items that also pass `radiusVisibleMin` - ported from
//    the legacy chart's own filter, which compares the RAW value/valueSecond
//    (never the scaled radius): keep only items with `value > radiusVisibleMin`
//    AND (`valueSecond` is absent OR `valueSecond >= radiusVisibleMin`). This is
//    the population that is actually force-simulated and drawn.
import type { SymbolMapDataItem } from "../types";

export interface SymbolMapNode {
  id: string;
  label: string;
  lng: number;
  lat: number;
  /** Clamped to >= 0 (a negative value can never light up a real radius; see
   * validate/symbolMapWarnings.ts, which flags the input instead of silently
   * fixing it up here). */
  value: number;
  valueSecond: number | null;
  color?: string;
}

export interface ProcessedSymbolMap {
  located: SymbolMapNode[];
  visible: SymbolMapNode[];
  /** Non-disabled items dropped for missing/invalid lng/lat. */
  invalidCount: number;
  /** Unique visible labels in encounter order (colour groups). */
  groupKeys: string[];
  /** Explicit colours from each visible item's `color` field, keyed by label. */
  groupColors: Record<string, string>;
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** True for a finite lng in [-180,180] and lat in [-90,90]. */
export function isValidCoordinate(lng: unknown, lat: unknown): boolean {
  return finite(lng) && finite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

export function processSymbolMapData(
  dataSet: SymbolMapDataItem[],
  opts: { disabledItems?: string[]; radiusVisibleMin?: number } = {}
): ProcessedSymbolMap {
  const disabled = new Set(opts.disabledItems ?? []);
  const min = opts.radiusVisibleMin;

  const nonDisabled = (dataSet ?? []).filter((d) => !disabled.has(d.label));
  const invalidCount = nonDisabled.filter((d) => !isValidCoordinate(d.lng, d.lat)).length;

  const located: SymbolMapNode[] = nonDisabled
    .filter((d) => isValidCoordinate(d.lng, d.lat))
    .map((d) => ({
      id: d.id,
      label: d.label,
      lng: d.lng,
      lat: d.lat,
      value: finite(d.value) ? Math.max(0, d.value) : 0,
      valueSecond: finite(d.valueSecond) ? Math.max(0, d.valueSecond as number) : null,
      color: d.color,
    }));

  const visible =
    min === undefined
      ? located
      : located.filter((n) => n.value > min && (n.valueSecond === null || n.valueSecond >= min));

  const groupKeys: string[] = [];
  for (const n of visible) if (!groupKeys.includes(n.label)) groupKeys.push(n.label);

  const groupColors: Record<string, string> = {};
  for (const n of visible) if (n.color && !groupColors[n.label]) groupColors[n.label] = n.color;

  return { located, visible, invalidCount, groupKeys, groupColors };
}
