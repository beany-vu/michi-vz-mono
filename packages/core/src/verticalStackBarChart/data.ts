// VerticalStackBar data pipeline (pure): key extraction, ordering, disabled
// filtering, date band, y-domain. Verbatim key-union logic from the legacy.
import type { VerticalStackBarChartProps, VerticalStackBarDataSet } from "../types";

const RESERVED = new Set(["date", "code"]);

// Union of all segment keys across every row of every DataSet (insertion order),
// excluding the reserved "date"/"code".
export function extractDataKeys(dataSet: VerticalStackBarDataSet[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ds of dataSet) {
    for (const row of ds.series) {
      for (const k of Object.keys(row)) {
        if (!RESERVED.has(k) && !seen.has(k)) {
          seen.add(k);
          out.push(k);
        }
      }
    }
  }
  return out;
}

// Explicit `keys` first (those that exist, in prop order), remaining natural keys
// appended; then drop disabledItems.
export function resolveEffectiveKeys(
  dataKeys: string[],
  keys?: string[],
  disabledItems?: string[]
): string[] {
  const disabled = new Set(disabledItems ?? []);
  let ordered: string[];
  if (keys && keys.length > 0) {
    const present = keys.filter((k) => dataKeys.includes(k));
    const rest = dataKeys.filter((k) => !present.includes(k));
    ordered = [...present, ...rest];
  } else {
    ordered = dataKeys;
  }
  return ordered.filter((k) => !disabled.has(k));
}

export function collectDates(
  dataSet: VerticalStackBarDataSet[],
  xAxisDomain?: string[]
): string[] {
  if (xAxisDomain && xAxisDomain.length > 0) return xAxisDomain;
  const set = new Set<string>();
  for (const ds of dataSet) {
    for (const row of ds.series) {
      if (row.date != null) set.add(row.date);
    }
  }
  return [...set].sort();
}

// Grand total at a date (sum across all DataSets + keys), for the optional filter.
function dateTotal(dataSet: VerticalStackBarDataSet[], keys: string[], date: string): number {
  let t = 0;
  for (const ds of dataSet) {
    for (const row of ds.series) {
      if (row.date !== date) continue;
      for (const k of keys) {
        const v = Number(row[k]);
        if (Number.isFinite(v)) t += v;
      }
    }
  }
  return t;
}

// Top-N dates by grand total (asc/desc), preserving chronological order in output.
export function applyDateFilter(
  dates: string[],
  dataSet: VerticalStackBarDataSet[],
  keys: string[],
  filter: NonNullable<VerticalStackBarChartProps["filter"]>
): string[] {
  const dir = filter.sortingDir === "asc" ? 1 : -1;
  const ranked = [...dates]
    .sort((a, b) => dir * (dateTotal(dataSet, keys, a) - dateTotal(dataSet, keys, b)))
    .slice(0, filter.limit);
  const keep = new Set(ranked);
  return dates.filter((d) => keep.has(d));
}

// y-domain from per-(DataSet,row) totals: [min(<0)|0, max].
export function computeYDomain(
  dataSet: VerticalStackBarDataSet[],
  keys: string[],
  yAxisDomain?: [number, number]
): [number, number] {
  if (yAxisDomain) return yAxisDomain;
  let min = 0;
  let max = 0;
  for (const ds of dataSet) {
    for (const row of ds.series) {
      let t = 0;
      for (const k of keys) {
        const v = Number(row[k]);
        if (Number.isFinite(v)) t += v;
      }
      if (t > max) max = t;
      if (t < min) min = t;
    }
  }
  return [min, max];
}
