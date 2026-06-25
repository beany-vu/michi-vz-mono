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

export function defaultXAxisFormatter(
  xAxisDataType: XaxisDataType,
  locale?: string
): (d: number | string) => string {
  if (xAxisDataType === "number") return defaultNumberFormatter(locale);
  const annual = new Intl.DateTimeFormat(locale, { year: "numeric" });
  const monthly = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short" });
  return (d) => {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    return xAxisDataType === "date_annual" ? annual.format(date) : monthly.format(date);
  };
}
