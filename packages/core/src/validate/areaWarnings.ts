// onDataWarning checks for AreaChart: empty series/keys + non-finite values for
// any active key.
import type { AreaDataRow, DataWarning } from "../types";

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
