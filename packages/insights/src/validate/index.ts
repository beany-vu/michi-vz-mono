// Richer data-quality validation — a companion to core's `onDataWarning`. Pure +
// deterministic: it walks a Line series (or every series of a LineChart) and reports
// statistical/shape issues as DataWarning[]. It re-uses ONLY the safe, existing
// DataWarning `type` members from core (a fixed union there); all the specifics go in
// `message`. No DOM, no deps — easy to test and to fold into the plugin `validate()`
// hook (which is merged into the engine's onDataWarning path).
import type { Annotation, DataPoint, DataWarning, LineChartProps, MichiVzPlugin } from "@michi-vz/core";

/** Parse a DataPoint.date to a number if it is numeric (a real number, or a numeric string). */
function numericDate(date: number | string): number | null {
  if (typeof date === "number") return Number.isFinite(date) ? date : null;
  const trimmed = date.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Validate a single series for data-quality problems and return one warning per issue:
 *  - "empty-dataset":      the series has no points.
 *  - "non-finite-value":   a point's value is NaN / Infinity / -Infinity.
 *  - "duplicate-date":     the same `date` appears more than once.
 *  - "non-monotonic-date": numeric dates are not non-decreasing (a backwards step).
 *
 * Dates are only checked for monotonicity when EVERY date in the series parses to a
 * finite number — categorical / string axes carry no inherent order, so we stay quiet.
 */
export function validateSeries(series: DataPoint[]): DataWarning[] {
  const warnings: DataWarning[] = [];

  if (series.length === 0) {
    warnings.push({ type: "empty-dataset", message: "series has no data points" });
    return warnings;
  }

  // Non-finite values — one warning per offending point (index + value reported).
  for (let i = 0; i < series.length; i++) {
    const v = series[i].value;
    if (!Number.isFinite(v)) {
      warnings.push({
        type: "non-finite-value",
        message: `value at index ${i} (date ${String(series[i].date)}) is not finite: ${String(v)}`,
      });
    }
  }

  // Duplicate dates — report each repeated key once, in first-seen order.
  const seen = new Map<string, number>();
  const reported = new Set<string>();
  for (let i = 0; i < series.length; i++) {
    const key = String(series[i].date);
    if (seen.has(key)) {
      if (!reported.has(key)) {
        reported.add(key);
        warnings.push({
          type: "duplicate-date",
          message: `date ${key} appears more than once (first at index ${seen.get(key)}, again at index ${i})`,
        });
      }
    } else {
      seen.set(key, i);
    }
  }

  // Non-monotonic numeric dates — only when the whole axis is numeric.
  const nums = series.map((d) => numericDate(d.date));
  if (nums.every((n) => n !== null)) {
    const xs = nums as number[];
    for (let i = 1; i < xs.length; i++) {
      if (xs[i] < xs[i - 1]) {
        warnings.push({
          type: "non-monotonic-date",
          message: `date decreases at index ${i}: ${xs[i]} comes after ${xs[i - 1]}`,
        });
      }
    }
  }

  return warnings;
}

/** A specific point that failed validation, with where it is. */
export interface InvalidPoint {
  index: number;
  date: number | string;
  value: number;
  kind: "non-finite" | "duplicate-date" | "non-monotonic";
}

/** The exact points in a series that are invalid (so they can be highlighted on the chart). */
export function invalidPoints(series: DataPoint[]): InvalidPoint[] {
  const out: InvalidPoint[] = [];
  const nums = series.map((d) => numericDate(d.date));
  const allNumeric = nums.every((n) => n !== null);
  const seen = new Set<string>();
  for (let i = 0; i < series.length; i++) {
    const d = series[i];
    if (!Number.isFinite(d.value)) out.push({ index: i, date: d.date, value: d.value, kind: "non-finite" });
    const key = String(d.date);
    if (seen.has(key)) out.push({ index: i, date: d.date, value: d.value, kind: "duplicate-date" });
    seen.add(key);
    if (allNumeric && i > 0 && (nums[i] as number) < (nums[i - 1] as number)) {
      out.push({ index: i, date: d.date, value: d.value, kind: "non-monotonic" });
    }
  }
  return out;
}

export interface ValidatePluginOptions {
  /** highlight the invalid points/dates on the chart (red marker / dashed line). Default true. */
  highlight?: boolean;
}

/**
 * `validate()` plugin — reports data-quality problems via `onDataWarning` AND (when
 * `highlight` is on) marks the offending points on the chart: a red dot on a bad
 * value/duplicate/out-of-order point, or a red dashed line at a non-finite point's
 * date. Distinct from highlightItems (which highlights a whole series).
 */
export function validate(options: ValidatePluginOptions = {}): MichiVzPlugin<LineChartProps> {
  const highlight = options.highlight ?? true;
  return {
    name: "validate",

    validate(props) {
      return props.dataSet.flatMap((item) =>
        validateSeries(item.series).map((w) => ({
          ...w,
          label: item.label,
          message: `${item.label}: ${w.message}`,
        }))
      );
    },

    annotate(ctx, pc) {
      if (!highlight || ctx.chartType !== "line-chart") return [];
      const anns: Annotation[] = [];
      for (const item of pc.getProps().dataSet) {
        for (const p of invalidPoints(item.series)) {
          anns.push(
            Number.isFinite(p.value)
              ? { type: "point", at: p.date, value: p.value, label: "invalid", color: "#d4351c" }
              : { type: "vline", at: p.date, label: "invalid", color: "#d4351c", dashed: true }
          );
        }
      }
      return anns;
    },
  };
}
