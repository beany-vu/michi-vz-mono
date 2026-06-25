// Malformed-data warnings (the core `onDataWarning` hook). A richer, model-free
// companion to the optional @michi-vz/insights/validate plugin. Catches the bug
// classes michi-vz has historically guarded against.
import type { GapDataItem, DataWarning } from "../types";

export function checkGapData(dataSet: GapDataItem[]): DataWarning[] {
  const warnings: DataWarning[] = [];

  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "dataSet is empty." });
    return warnings;
  }

  const seen = new Set<string>();
  for (const d of dataSet) {
    if (!Number.isFinite(d.value1) || !Number.isFinite(d.value2)) {
      warnings.push({
        type: "non-finite-value",
        label: d.label,
        message: `"${d.label}" has a non-finite value (value1=${d.value1}, value2=${d.value2}).`,
      });
    }
    if (seen.has(d.label)) {
      warnings.push({
        type: "duplicate-label",
        label: d.label,
        message: `Duplicate label "${d.label}" — only one will be rendered per y-band.`,
      });
    }
    seen.add(d.label);

    if (d.difference != null && Number.isFinite(d.difference)) {
      const expected = d.value1 - d.value2;
      if (Math.abs(d.difference - expected) > 1e-9) {
        warnings.push({
          type: "difference-mismatch",
          label: d.label,
          message: `"${d.label}" difference (${d.difference}) != value1 - value2 (${expected}).`,
        });
      }
    }
  }

  return warnings;
}
