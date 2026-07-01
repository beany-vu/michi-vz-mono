// Moved from michi-vz src/components/hooks/lineChart/lineChartUtils.ts.
// NOTE: `sanitizeForClassName` is NOT redefined here - it is imported from the
// single source of truth (math/sanitize) per the hard rules. Only the pure
// scale-domain / colour / x-parse helpers move here.
import type { LineDataItem, XaxisDataType } from "../types";

export function getColor(mappedColor?: string, dataColor?: string): string {
  const FALLBACK_COLOR = "rgba(253, 253, 253, 0.5)";
  if (mappedColor) return mappedColor;
  if (dataColor) return dataColor;
  return FALLBACK_COLOR;
}

// Parse a raw x-axis value into the type the d3 x-scale expects:
//  - "number"       -> the numeric value
//  - "date_annual"  -> a Date at Jan 1 of that year
//  - "date_monthly" -> a Date parsed from the raw value
export function parseXValue(date: number | string, xAxisDataType: XaxisDataType): number | Date {
  if (xAxisDataType === "number") return Number(date);
  if (xAxisDataType === "date_annual") return new Date(`${date}-01-01`);
  return new Date(date);
}

// Single-pass [min, max] of every series value, ignoring null/undefined/NaN.
// Empty / all-gap data falls back to [0, 1].
export function getYScaleDomain(filteredDataSet: LineDataItem[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const item of filteredDataSet) {
    for (const d of item.series) {
      const v = d.value;
      if (v === null || v === undefined || Number.isNaN(v)) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  return [lo === Infinity ? 0 : lo, hi === -Infinity ? 1 : hi];
}

// Normalize a parsed x-Date to its PERIOD boundary as epoch ms (UTC):
//  - date_annual  -> Jan 1 of that year
//  - date_monthly -> the 1st of that month
// Matches parseXValue's UTC parsing, so an enumerated tick and a data point in the
// same period compare EQUAL even if the raw date was mid-period (e.g. "2020-02-15").
export function periodValue(d: Date, xAxisDataType: XaxisDataType): number {
  return xAxisDataType === "date_annual"
    ? Date.UTC(d.getUTCFullYear(), 0, 1)
    : Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

// Every period boundary between two parsed x-Dates (inclusive), as epoch ms. Backs
// `fillPeriodTicks`: a tick for EVERY month/year in range, including periods with no
// data (drawn faded). Endpoints normalize to their period so first/last stay exact.
// Plain Date math - core deliberately keeps date-fns out. Date types only.
export function enumeratePeriods(
  minDate: Date,
  maxDate: Date,
  xAxisDataType: XaxisDataType
): number[] {
  const out: number[] = [];
  if (xAxisDataType === "date_annual") {
    for (let y = minDate.getUTCFullYear(); y <= maxDate.getUTCFullYear(); y++) {
      out.push(Date.UTC(y, 0, 1));
    }
    return out;
  }
  // date_monthly: walk month-by-month from the min period to the max period.
  let y = minDate.getUTCFullYear();
  let m = minDate.getUTCMonth();
  const yEnd = maxDate.getUTCFullYear();
  const mEnd = maxDate.getUTCMonth();
  while (y < yEnd || (y === yEnd && m <= mEnd)) {
    out.push(Date.UTC(y, m, 1));
    if (++m > 11) {
      m = 0;
      y++;
    }
  }
  return out;
}

// Single-pass [min, max] of every series x-value, as plain numbers (epoch ms for
// date types). Empty data falls back to [0, 1].
export function getXScaleDomain(
  filteredDataSet: LineDataItem[],
  xAxisDataType: XaxisDataType
): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const item of filteredDataSet) {
    for (const d of item.series) {
      const parsed = parseXValue(d.date, xAxisDataType);
      const n = typeof parsed === "number" ? parsed : parsed.getTime();
      if (Number.isNaN(n)) continue;
      if (n < lo) lo = n;
      if (n > hi) hi = n;
    }
  }
  return [lo === Infinity ? 0 : lo, hi === -Infinity ? 1 : hi];
}
