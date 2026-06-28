// FountainChart data pipeline (pure): filter disabled jets, decide snapshot vs
// trend mode, derive the band labels / x-domain, and the y-domain (0 .. value+spread).
import { parseXValue } from "../lineChart/lineUtils";
import type { FountainDataItem, FountainXAxisType, XaxisDataType } from "../types";

export interface ProcessedFountain {
  /** Jets that are not disabled, in input order */
  items: FountainDataItem[];
  mode: "snapshot" | "trend";
  /** The temporal x type when in trend mode, else null */
  temporalType: XaxisDataType | null;
  /** Band categories (snapshot) — the deduped jet labels */
  labels: string[];
  /** [min, max] x in numeric/epoch-ms space (trend mode only) */
  xDomain: [number, number];
  /** [min, max] value (y) domain including the plume headroom */
  yAxisDomain: [number, number];
  /** Largest density across the dataset (0 when none provided) */
  maxDensity: number;
}

function isTemporal(t: FountainXAxisType | undefined): t is XaxisDataType {
  return t === "number" || t === "date_annual" || t === "date_monthly";
}

export function processFountainData(
  dataSet: FountainDataItem[],
  xAxisDataType: FountainXAxisType | undefined,
  disabledItems?: string[],
  yAxisDomain?: [number, number]
): ProcessedFountain {
  const disabled = new Set(disabledItems ?? []);
  const items = (dataSet ?? []).filter((d) => !disabled.has(d.label));

  const temporalType = isTemporal(xAxisDataType) ? xAxisDataType : null;
  const allHaveDate =
    items.length > 0 && items.every((d) => d.date !== undefined && d.date !== null && d.date !== "");
  const mode: "snapshot" | "trend" = temporalType && allHaveDate ? "trend" : "snapshot";

  const labels: string[] = [];
  const seen = new Set<string>();
  for (const d of items) {
    if (!seen.has(d.label)) {
      seen.add(d.label);
      labels.push(d.label);
    }
  }

  let maxTop = 0;
  let maxDensity = 0;
  for (const d of items) {
    const v = Number(d.value);
    const s = Math.abs(Number(d.spread));
    const top = (Number.isFinite(v) ? v : 0) + (Number.isFinite(s) ? s : 0);
    if (top > maxTop) maxTop = top;
    const den = Number(d.density);
    if (Number.isFinite(den) && den > maxDensity) maxDensity = den;
  }
  const yDomain = yAxisDomain ?? [0, (maxTop || 1) * 1.1];

  let xDomain: [number, number] = [0, 1];
  if (mode === "trend" && temporalType) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const d of items) {
      const parsed = parseXValue(d.date as number | string, temporalType);
      const n = typeof parsed === "number" ? parsed : parsed.getTime();
      if (Number.isNaN(n)) continue;
      if (n < lo) lo = n;
      if (n > hi) hi = n;
    }
    xDomain = [lo === Infinity ? 0 : lo, hi === -Infinity ? 1 : hi];
  }

  return { items, mode, temporalType, labels, xDomain, yAxisDomain: yDomain, maxDensity };
}
