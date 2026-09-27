import type { XaxisDataType } from "../types";

// Intl-based default formatters so numbers/dates are locale-correct out of the
// box. Consumers can still pass their own xAxisFormat / yAxisFormat to override.
// The data layer stays locale-independent (numbers / `${year}` strings); these
// only affect presentation.

export function defaultNumberFormatter(locale?: string): (d: number | string) => string {
  const nf = new Intl.NumberFormat(locale);
  return (d) => {
    const n = typeof d === "number" ? d : Number(d);
    return Number.isFinite(n) ? nf.format(n) : String(d);
  };
}

// Backs AreaChart's `stackOffset: "expand"` (100%-stacked) default y tick label;
// values live in [0,1] and Intl's percent style does the *100 + "%" for us.
export function defaultPercentFormatter(locale?: string): (d: number | string) => string {
  const nf = new Intl.NumberFormat(locale, { style: "percent" });
  return (d) => {
    const n = typeof d === "number" ? d : Number(d);
    return Number.isFinite(n) ? nf.format(n) : String(d);
  };
}

/** True for an instant at exactly 00:00:00.000 UTC. */
function isUtcMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

/**
 * Formats a period date (a year, or a month and year) so it reads as the period the
 * data meant in every time zone. An instant at exactly UTC midnight is the form
 * parseXValue makes from "2021" or "2021-01" (date-only strings parse as UTC), so it
 * is formatted in UTC: in local time it would read as the year or month before
 * anywhere west of UTC. Any other instant (a local-midnight Date such as
 * new Date(2021, 0, 1), a d3 time tick) is formatted in local time, so it too keeps
 * its own year east and west of UTC. "date_annual" prints the year; every other type
 * the short month and year.
 */
export function periodDateFormatter(
  xAxisDataType: Exclude<XaxisDataType, "number">,
  locale?: string,
): (d: number | string | Date) => string {
  const opts: Intl.DateTimeFormatOptions =
    xAxisDataType === "date_annual" ? { year: "numeric" } : { year: "numeric", month: "short" };
  const local = new Intl.DateTimeFormat(locale, opts);
  const utc = new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" });
  return (d) => {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    return (isUtcMidnight(date) ? utc : local).format(date);
  };
}

export function defaultXAxisFormatter(
  xAxisDataType: XaxisDataType,
  locale?: string,
): (d: number | string) => string {
  if (xAxisDataType === "number") return defaultNumberFormatter(locale);
  return periodDateFormatter(xAxisDataType, locale);
}
