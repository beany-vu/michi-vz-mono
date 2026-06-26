// onDataWarning checks for VerticalStackBar: empty dataset + non-finite values on
// explicitly-present (owned) keys.
import type { DataWarning, VerticalStackBarDataSet } from "../types";

export function checkStackData(dataSet: VerticalStackBarDataSet[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "VerticalStackBar received an empty dataSet." });
    return warnings;
  }
  for (const ds of dataSet) {
    for (const row of ds.series) {
      for (const k of Object.keys(row)) {
        if (k === "date" || k === "code") continue;
        const v = row[k];
        if (v === null || v === undefined) continue; // missing is allowed (guarded)
        if (!Number.isFinite(Number(v))) {
          warnings.push({
            type: "non-finite-value",
            message: `Series "${ds.seriesKey}" has a non-finite "${k}" at ${String(row.date)}.`,
            label: k,
          });
        }
      }
    }
  }
  return warnings;
}
