// onDataWarning checks for Treemap: empty dataset, non-finite leaf values, and
// partial > value (a split that exceeds its total).
import type { DataWarning, TreemapNode } from "../types";

export function checkTreemapData(dataSet: TreemapNode[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "Treemap received an empty dataSet." });
    return warnings;
  }
  const walk = (nodes: TreemapNode[]): void => {
    for (const n of nodes) {
      if (n.children && n.children.length) {
        walk(n.children);
        continue;
      }
      if (n.value !== undefined && !Number.isFinite(Number(n.value))) {
        warnings.push({
          type: "non-finite-value",
          message: `Treemap leaf "${n.label}" has a non-finite value.`,
          label: n.label,
        });
      }
      if (
        n.partial !== undefined &&
        Number.isFinite(Number(n.partial)) &&
        Number.isFinite(Number(n.value)) &&
        Number(n.partial) > Number(n.value)
      ) {
        warnings.push({
          type: "difference-mismatch",
          message: `Treemap leaf "${n.label}" has partial (${n.partial}) greater than value (${n.value}).`,
          label: n.label,
        });
      }
    }
  };
  walk(dataSet);
  return warnings;
}
