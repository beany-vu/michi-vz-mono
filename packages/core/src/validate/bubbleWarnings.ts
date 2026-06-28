// onDataWarning checks for Bubble: empty dataset, non-finite/negative values,
// partial > value (a split that exceeds its total), and duplicate labels.
import type { BubbleDataItem, DataWarning } from "../types";

export function checkBubbleData(dataSet: BubbleDataItem[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "Bubble chart received an empty dataSet." });
    return warnings;
  }
  const seen = new Set<string>();
  for (const d of dataSet) {
    if (d.value !== undefined && !Number.isFinite(Number(d.value))) {
      warnings.push({
        type: "non-finite-value",
        message: `Bubble "${d.label}" has a non-finite value.`,
        label: d.label,
      });
    } else if (Number(d.value) < 0) {
      warnings.push({
        type: "non-finite-value",
        message: `Bubble "${d.label}" has a negative value (${d.value}); it is clamped to 0.`,
        label: d.label,
      });
    }
    if (
      d.partial !== undefined &&
      Number.isFinite(Number(d.partial)) &&
      Number.isFinite(Number(d.value)) &&
      Number(d.partial) > Number(d.value)
    ) {
      warnings.push({
        type: "difference-mismatch",
        message: `Bubble "${d.label}" has partial (${d.partial}) greater than value (${d.value}).`,
        label: d.label,
      });
    }
    if (seen.has(d.label)) {
      warnings.push({
        type: "duplicate-label",
        message: `Bubble has a duplicate label "${d.label}".`,
        label: d.label,
      });
    }
    seen.add(d.label);
  }
  return warnings;
}
