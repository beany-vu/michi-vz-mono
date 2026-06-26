// Moved verbatim from michi-vz src/components/hooks/lineChart/detectGaps.ts
// (pure, framework-free). Auto-detects missing time periods and derives the
// per-point `certainty` flag that the renderer turns into solid/dashed runs.
import type { DataPoint, XaxisDataType } from "../types";

// Parse a point's date into a comparable number in AXIS UNITS, so segment deltas
// are clean integers: the numeric value (number), the year (date_annual), or a
// month index year*12 + (month-1) (date_monthly). Returns NaN when unparseable.
export const parseAxisUnit = (date: number | string, xAxisDataType: XaxisDataType): number => {
  if (xAxisDataType === "number") {
    const n = Number(date);
    return Number.isFinite(n) ? n : NaN;
  }
  if (xAxisDataType === "date_annual") {
    const year = Number(String(date).slice(0, 4));
    return Number.isFinite(year) ? year : NaN;
  }
  // date_monthly: prefer an explicit "YYYY-MM" prefix; fall back to Date parsing.
  const match = /^(\d{4})-(\d{1,2})/.exec(String(date));
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (Number.isFinite(year) && month >= 1 && month <= 12) return year * 12 + (month - 1);
    return NaN;
  }
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? NaN : d.getFullYear() * 12 + d.getMonth();
};

// Default expected step per axis type (in parseAxisUnit units). number has no
// implied cadence, so it must be supplied via expectedStep (null here).
const defaultStepFor = (xAxisDataType: XaxisDataType): number | null =>
  xAxisDataType === "number" ? null : 1;

const isDev = (): boolean => {
  try {
    return (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !==
      "production";
  } catch {
    return true;
  }
};

// Auto-detect missing time periods and derive `certainty`. Call only when the
// consumer opted in (detectGaps === true).
//
// - Normalizes: drops points with invalid/NaN axis x or value, sorts ascending
//   by axis x, dedupes equal x keeping the LAST occurrence.
// - Marks the segment INTO a point uncertain (certainty:false) when the gap to
//   the previous point exceeds the expected step. A detected gap overrides an
//   explicit certainty:true; it never flips an explicit certainty:false.
export const applyGapDetection = (
  series: DataPoint[],
  xAxisDataType: XaxisDataType,
  expectedStep?: number
): DataPoint[] => {
  if (!series || series.length === 0) return series ?? [];

  // 1. Normalize: parse axis unit, drop invalid, sort ascending, dedupe (keep last).
  const parsed = series
    .map((d) => ({ d, u: parseAxisUnit(d.date, xAxisDataType) }))
    .filter(
      ({ d, u }) =>
        Number.isFinite(u) &&
        d.value !== null &&
        d.value !== undefined &&
        !Number.isNaN(d.value as number)
    );

  parsed.sort((a, b) => a.u - b.u);

  const deduped: { d: DataPoint; u: number }[] = [];
  for (const entry of parsed) {
    const last = deduped[deduped.length - 1];
    if (last && last.u === entry.u) deduped[deduped.length - 1] = entry;
    else deduped.push(entry);
  }

  const droppedCount = series.length - parsed.length;
  const duplicateCount = parsed.length - deduped.length;
  if ((droppedCount > 0 || duplicateCount > 0) && isDev()) {
    // eslint-disable-next-line no-console
    console.warn(
      `[michi-vz] detectGaps normalized a series: dropped ${droppedCount} invalid point(s), ` +
        `removed ${duplicateCount} duplicate(s); data was sorted by x.`
    );
  }

  // 2. Resolve expected step. number requires an explicit step. A non-positive or
  // non-finite expectedStep is treated as "not provided" — otherwise a 0/negative
  // step would mark every segment a gap (we can't trust the caller's value).
  const validStep =
    typeof expectedStep === "number" && Number.isFinite(expectedStep) && expectedStep > 0
      ? expectedStep
      : null;
  const step = validStep ?? defaultStepFor(xAxisDataType);
  if (step == null) {
    if (isDev()) {
      // eslint-disable-next-line no-console
      console.warn(
        `[michi-vz] detectGaps: xAxisDataType "number" requires an expectedStep; gap detection skipped.`
      );
    }
    return deduped.map((e) => e.d);
  }

  // 3. Detect gaps and derive certainty (shallow-clone only changed points).
  return deduped.map((entry, i) => {
    if (i === 0) return entry.d; // first point has no incoming segment
    // Strictly greater: a delta equal to the expected step is contiguous, not a gap.
    const isGap = entry.u - deduped[i - 1].u > step;
    if (isGap && entry.d.certainty !== false) return { ...entry.d, certainty: false };
    return entry.d;
  });
};
