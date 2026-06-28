// onDataWarning checks for Pie: empty dataset, non-finite slice values, negative
// values, and duplicate slice labels (which would collide on the colour key).
import type { DataWarning, PieDataItem } from "../types";

export function checkPieData(dataSet: PieDataItem[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "Pie chart received an empty dataSet." });
    return warnings;
  }
  const seen = new Set<string>();
  for (const d of dataSet) {
    if (d.value !== undefined && !Number.isFinite(Number(d.value))) {
      warnings.push({
        type: "non-finite-value",
        message: `Pie slice "${d.label}" has a non-finite value.`,
        label: d.label,
      });
    } else if (Number(d.value) < 0) {
      warnings.push({
        type: "non-finite-value",
        message: `Pie slice "${d.label}" has a negative value (${d.value}); it is clamped to 0.`,
        label: d.label,
      });
    }
    if (seen.has(d.label)) {
      warnings.push({
        type: "duplicate-label",
        message: `Pie has a duplicate slice label "${d.label}".`,
        label: d.label,
      });
    }
    seen.add(d.label);
  }
  return warnings;
}
