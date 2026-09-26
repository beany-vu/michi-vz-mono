// onDataWarning checks for AreaChart: empty series/keys + non-finite values for
// any active key, plus option combinations the chart has to ignore.
import type { AreaChartProps, AreaDataRow, DataWarning } from "../types";

export function checkAreaData(series: AreaDataRow[], keys: string[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!series || series.length === 0) {
    warnings.push({ type: "empty-dataset", message: "AreaChart received an empty series." });
    return warnings;
  }
  if (!keys || keys.length === 0) {
    warnings.push({ type: "empty-dataset", message: "AreaChart received no keys to stack." });
    return warnings;
  }

  for (const row of series) {
    for (const key of keys) {
      const v = row[key];
      if (v !== undefined && !Number.isFinite(Number(v))) {
        warnings.push({
          type: "non-finite-value",
          message: `Row ${String(row.date)} has a non-finite value for "${key}".`,
          label: key,
        });
      }
    }
  }
  return warnings;
}

/** Option conflicts: `stackOffset: "expand"` normalizes a STACK, so it has nothing to
 *  act on once `stacked: false` draws the areas overlapping; it is ignored. */
export function checkAreaOptions(
  o: Pick<AreaChartProps, "stacked" | "stackOffset">,
): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (o.stacked === false && o.stackOffset === "expand") {
    warnings.push({
      type: "ignored-option",
      message:
        'AreaChart stackOffset "expand" is ignored when stacked is false: overlapping areas are drawn from zero to their own values.',
    });
  }
  return warnings;
}
