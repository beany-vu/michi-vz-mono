// FountainChart data pipeline (pure). Resolves every item into a jet the render
// model can draw without further checks: the big dot's value (given, or the
// median of the samples), the range [low, high] (explicit ends > spread >
// min/max of the samples > none), the finite samples, the forecast flag and, in
// trend mode, the parsed x. Every repair it makes (a range extended to cover the
// value or a sample, swapped ends, dropped samples, skipped jets) is reported as a
// DataWarning, so nothing is silently redrawn (audit fountain #3).
import { parseXValue } from "../lineChart/lineUtils";
import type { DataWarning, FountainDataItem, FountainXAxisType, XaxisDataType } from "../types";

/** One item resolved for drawing. Plain numbers only. */
export interface FountainResolvedJet {
  /** The source item (for the tooltip formatter and the context) */
  item: FountainDataItem;
  /** Index of the item in the dataSet */
  index: number;
  label: string;
  code?: string;
  /** The big dot: the item's value, or the median of its samples */
  value: number;
  /** True when `value` is the median of the samples (the item gave none) */
  valueFromSamples: boolean;
  /** Bottom of the fountain, or null when the item has no range */
  low: number | null;
  /** Top of the fountain, or null when the item has no range */
  high: number | null;
  /** Where the range came from; null = value only, no fountain */
  rangeSource: "low-high" | "spread" | "samples" | null;
  /** The finite samples, ascending (every one inside [low, high]) */
  samples: number[];
  /** A predicted jet (forecast ?? predicted ?? certainty === false) */
  forecast: boolean;
  /** The raw date in trend mode, null in snapshot mode */
  date: number | string | null;
  /** The parsed x in trend mode (a number, epoch ms for date axes), null in snapshot mode */
  x: number | null;
  /** True when the label is in disabledItems (kept in `all`, left out of `jets`) */
  disabled: boolean;
}

/** One distinct trend period (jets that share an x share it). */
export interface FountainPeriod {
  /** The raw date of the first jet seen at this x */
  date: number | string;
  /** Parsed x (a number, epoch ms for date axes) */
  x: number;
}

export interface ResolvedFountainData {
  mode: "snapshot" | "trend";
  /** The temporal x type in trend mode, else null */
  temporalType: XaxisDataType | null;
  /** Every resolvable jet, disabled ones included (flagged), in dataSet order */
  all: FountainResolvedJet[];
  /** The jets to draw (not disabled), in dataSet order */
  jets: FountainResolvedJet[];
  /** Distinct labels of the WHOLE dataSet in first-seen order: colour and legend slots */
  allLabels: string[];
  /** Distinct labels of the drawn jets in first-seen order: the snapshot columns */
  labels: string[];
  /** Trend mode: the distinct periods of the drawn jets, ascending by x ([] in snapshot) */
  periods: FountainPeriod[];
  /** [min, max] x of the drawn jets in trend mode, [0, 1] otherwise */
  xDomain: [number, number];
  /** Everything repaired or skipped while resolving (all items, disabled or not) */
  warnings: DataWarning[];
}

export interface ResolveFountainOptions {
  xAxisDataType?: FountainXAxisType;
  disabledItems?: string[];
}

function isTemporal(t: FountainXAxisType | undefined): t is XaxisDataType {
  return t === "number" || t === "date_annual" || t === "date_monthly";
}

/** A finite number, or null. null, undefined and "" are missing (Number("") is 0). */
function finiteOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const isMissing = (v: unknown): boolean => v === null || v === undefined || v === "";

/** Median of a list of finite numbers (the mean of the two middles for an even count). */
export function fountainMedian(values: ReadonlyArray<number>): number {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Forecast status: `forecast`, then the deprecated `predicted`, then `certainty === false`. */
export function isFountainForecast(item: FountainDataItem): boolean {
  if (typeof item.forecast === "boolean") return item.forecast;
  if (typeof item.predicted === "boolean") return item.predicted;
  return item.certainty === false;
}

function parsedX(date: unknown, t: XaxisDataType): number | null {
  if (isMissing(date) || (typeof date !== "number" && typeof date !== "string")) return null;
  const p = parseXValue(date, t);
  const n = typeof p === "number" ? p : p.getTime();
  return Number.isFinite(n) ? n : null;
}

export function resolveFountainData(
  dataSet: FountainDataItem[] | null | undefined,
  opts: ResolveFountainOptions = {},
): ResolvedFountainData {
  const items = Array.isArray(dataSet) ? dataSet : [];
  const disabled = new Set(opts.disabledItems ?? []);
  const temporal = isTemporal(opts.xAxisDataType) ? opts.xAxisDataType : null;
  // Trend when the axis is temporal and any item carries a date: a row without one
  // is skipped with a warning instead of flipping the whole chart to snapshot.
  const mode: "snapshot" | "trend" =
    temporal && items.some((d) => d && !isMissing(d.date)) ? "trend" : "snapshot";
  const temporalType = mode === "trend" ? temporal : null;

  const warnings: DataWarning[] = [];
  const warn = (type: DataWarning["type"], label: string, message: string): void => {
    warnings.push({ type, label, message: `FountainChart: ${message}` });
  };

  const all: FountainResolvedJet[] = [];
  const allLabels: string[] = [];
  const seenLabels = new Set<string>();

  items.forEach((item, index) => {
    if (!item) return;
    const label = String(item.label);
    if (!seenLabels.has(label)) {
      seenLabels.add(label);
      allLabels.push(label);
    }

    // Samples: finite only, ascending.
    const rawSamples = Array.isArray(item.samples) ? item.samples : [];
    const samples = rawSamples
      .map((s) => finiteOrNull(s))
      .filter((s): s is number => s !== null)
      .sort((a, b) => a - b);
    if (samples.length < rawSamples.length) {
      const dropped = rawSamples.length - samples.length;
      warn(
        "non-finite-value",
        label,
        `"${label}" has ${dropped} non-finite sample${dropped === 1 ? "" : "s"}; dropped.`,
      );
    }

    // Value: given, else the median of the samples, else the jet is skipped.
    let value = finiteOrNull(item.value);
    let valueFromSamples = false;
    if (value === null) {
      if (samples.length > 0) {
        if (!isMissing(item.value)) {
          warn(
            "non-finite-value",
            label,
            `"${label}" has a non-finite value (${String(item.value)}); the median of its samples is used.`,
          );
        }
        value = fountainMedian(samples);
        valueFromSamples = true;
      } else {
        warn(
          "non-finite-value",
          label,
          `"${label}" has no finite value and no samples; the jet is skipped.`,
        );
        return;
      }
    }

    // Trend mode: a jet needs a usable date.
    let x: number | null = null;
    if (temporalType) {
      x = parsedX(item.date, temporalType);
      if (x === null) {
        warn(
          "missing-date",
          label,
          `"${label}" has no usable date (${String(item.date)}) in trend mode; the jet is skipped.`,
        );
        return;
      }
    }

    // Range: explicit ends > spread > min/max of the samples > none. A missing end
    // falls back along the same chain, ending at the value.
    const expLow = finiteOrNull(item.low);
    const expHigh = finiteOrNull(item.high);
    let spread = finiteOrNull(item.spread);
    if (spread !== null && spread < 0) {
      warn(
        "inverted-range",
        label,
        `"${label}" has a negative spread (${spread}); its size is used.`,
      );
      spread = -spread;
    }
    const sMin = samples.length > 0 ? samples[0] : null;
    const sMax = samples.length > 0 ? samples[samples.length - 1] : null;
    const rangeSource: FountainResolvedJet["rangeSource"] =
      expLow !== null || expHigh !== null
        ? "low-high"
        : spread !== null
          ? "spread"
          : samples.length > 0
            ? "samples"
            : null;

    let low: number | null = null;
    let high: number | null = null;
    if (rangeSource !== null) {
      let lo = expLow ?? (spread !== null ? value - spread : null) ?? sMin ?? value;
      let hi = expHigh ?? (spread !== null ? value + spread : null) ?? sMax ?? value;
      if (lo > hi) {
        warn("inverted-range", label, `"${label}" has low (${lo}) above high (${hi}); swapped.`);
        [lo, hi] = [hi, lo];
      }
      if (rangeSource !== "samples" && sMin !== null && sMax !== null) {
        const outside = samples.filter((s) => s < lo || s > hi).length;
        if (outside > 0) {
          const nextLo = Math.min(lo, sMin);
          const nextHi = Math.max(hi, sMax);
          warn(
            "sample-outside-range",
            label,
            `"${label}" has ${outside} sample${outside === 1 ? "" : "s"} outside [${lo}, ${hi}]; the range is extended to [${nextLo}, ${nextHi}].`,
          );
          lo = nextLo;
          hi = nextHi;
        }
      }
      if (value < lo || value > hi) {
        warn(
          "range-excludes-value",
          label,
          `"${label}" has a range [${lo}, ${hi}] that leaves out its value ${value}; the range is extended to include it.`,
        );
        lo = Math.min(lo, value);
        hi = Math.max(hi, value);
      }
      low = lo;
      high = hi;
    }

    all.push({
      item,
      index,
      label,
      code: item.code,
      value,
      valueFromSamples,
      low,
      high,
      rangeSource,
      samples,
      forecast: isFountainForecast(item),
      date: temporalType ? (item.date as number | string) : null,
      x,
      disabled: disabled.has(label),
    });
  });

  // Two jets on one date overlap in trend mode (one warning per shared date).
  if (temporalType) {
    const byX = new Map<number, FountainResolvedJet[]>();
    for (const j of all) {
      const list = byX.get(j.x as number) ?? [];
      list.push(j);
      byX.set(j.x as number, list);
    }
    for (const list of byX.values()) {
      if (list.length < 2) continue;
      const names = list.map((j) => `"${j.label}"`).join(", ");
      warnings.push({
        type: "duplicate-date",
        label: list[0].label,
        message: `FountainChart: ${list.length} jets share the date ${String(list[0].date)} (${names}); they draw on top of each other.`,
      });
    }
  }

  const jets = all.filter((j) => !j.disabled);
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const j of jets) {
    if (seen.has(j.label)) continue;
    seen.add(j.label);
    labels.push(j.label);
  }

  const periods: FountainPeriod[] = [];
  if (temporalType) {
    const seenX = new Set<number>();
    for (const j of jets) {
      const x = j.x as number;
      if (seenX.has(x)) continue;
      seenX.add(x);
      periods.push({ date: j.date as number | string, x });
    }
    periods.sort((a, b) => a.x - b.x);
  }
  const xDomain: [number, number] =
    periods.length > 0 ? [periods[0].x, periods[periods.length - 1].x] : [0, 1];

  return { mode, temporalType, all, jets, allLabels, labels, periods, xDomain, warnings };
}

// ---------------------------------------------------------------------------
// Deprecated pre-1.29 pipeline, kept so the old public export keeps working.

export interface ProcessedFountain {
  /** Jets that are not disabled, in input order */
  items: FountainDataItem[];
  mode: "snapshot" | "trend";
  /** The temporal x type when in trend mode, else null */
  temporalType: XaxisDataType | null;
  /** Band categories (snapshot) - the deduped jet labels */
  labels: string[];
  /** [min, max] x in numeric/epoch-ms space (trend mode only) */
  xDomain: [number, number];
  /** [min, max] value (y) domain including the plume headroom */
  yAxisDomain: [number, number];
  /** Largest density across the dataset (0 when none provided) */
  maxDensity: number;
}

/** @deprecated since core 1.29: use resolveFountainData (ranges, samples, warnings). */
export function processFountainData(
  dataSet: FountainDataItem[],
  xAxisDataType: FountainXAxisType | undefined,
  disabledItems?: string[],
  yAxisDomain?: [number, number],
): ProcessedFountain {
  const disabled = new Set(disabledItems ?? []);
  const items = (dataSet ?? []).filter((d) => !disabled.has(d.label));

  const temporalType = isTemporal(xAxisDataType) ? xAxisDataType : null;
  const allHaveDate =
    items.length > 0 &&
    items.every((d) => d.date !== undefined && d.date !== null && d.date !== "");
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
