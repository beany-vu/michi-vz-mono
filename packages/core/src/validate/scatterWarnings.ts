// onDataWarning checks for ScatterPlot: empty dataset + non-finite x/y, and
// duplicate labels (each point's label is its identity/colour key).
import type { DataWarning, ScatterDataPoint } from "../types";

export function checkScatterData(dataSet: ScatterDataPoint[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "ScatterPlot received an empty dataSet." });
    return warnings;
  }
  const seen = new Set<string>();
  for (const p of dataSet) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      warnings.push({
        type: "non-finite-value",
        message: `Point "${p.label}" has a non-finite x/y.`,
        label: p.label,
      });
    }
    if (seen.has(p.label)) {
      warnings.push({
        type: "duplicate-label",
        message: `Duplicate point label "${p.label}".`,
        label: p.label,
      });
    }
    seen.add(p.label);
  }
  return warnings;
}
