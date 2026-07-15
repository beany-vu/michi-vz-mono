// onDataWarning checks for ComparableVerticalBar: empty dataset, non-finite
// values, duplicate labels. Dedicated file (NEWER house convention) rather than
// inlined in the engine, mirroring the decision logic ComparableHorizontalBarChart
// checks inline (see engine/comparableHorizontalBarChart.ts's checkData).
import type { ComparableBarDataPoint, DataWarning } from "../types";

export function checkComparableVerticalBarData(dataSet: ComparableBarDataPoint[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({
      type: "empty-dataset",
      message: "ComparableVerticalBar received an empty dataSet.",
    });
    return warnings;
  }
  const seen = new Set<string>();
  for (const d of dataSet) {
    if (!Number.isFinite(d.valueBased) || !Number.isFinite(d.valueCompared)) {
      warnings.push({
        type: "non-finite-value",
        message: `"${d.label}" has a non-finite value.`,
        label: d.label,
      });
    }
    if (seen.has(d.label)) {
      warnings.push({
        type: "duplicate-label",
        message: `Duplicate label "${d.label}".`,
        label: d.label,
      });
    }
    seen.add(d.label);
  }
  return warnings;
}
