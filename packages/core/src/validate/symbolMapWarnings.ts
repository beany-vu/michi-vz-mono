// onDataWarning checks for SymbolMap: missing/invalid lng-lat (dropped before
// layout - see symbolMap/data.ts's `located` population), negative values
// (clamped to 0 by the pure layer, but still worth flagging), and duplicate ids.
import { isValidCoordinate } from "../symbolMap/data";
import type { DataWarning, SymbolMapDataItem } from "../types";

export function checkSymbolMapData(dataSet: SymbolMapDataItem[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "SymbolMap chart received an empty dataSet." });
    return warnings;
  }

  const seen = new Set<string>();
  for (const d of dataSet) {
    if (!isValidCoordinate(d.lng, d.lat)) {
      warnings.push({
        type: "invalid-geometry",
        message: `Symbol "${d.label}" has a missing or out-of-range lng/lat (${d.lng}, ${d.lat}) and will not be drawn.`,
        label: d.label,
      });
    }
    if (d.value !== undefined && !Number.isFinite(Number(d.value))) {
      warnings.push({
        type: "non-finite-value",
        message: `Symbol "${d.label}" has a non-finite value.`,
        label: d.label,
      });
    } else if (Number(d.value) < 0) {
      warnings.push({
        type: "non-finite-value",
        message: `Symbol "${d.label}" has a negative value (${d.value}); it is clamped to 0.`,
        label: d.label,
      });
    }
    if (
      d.valueSecond !== undefined &&
      Number.isFinite(Number(d.valueSecond)) &&
      Number(d.valueSecond) < 0
    ) {
      warnings.push({
        type: "non-finite-value",
        message: `Symbol "${d.label}" has a negative valueSecond (${d.valueSecond}); it is clamped to 0.`,
        label: d.label,
      });
    }
    if (seen.has(d.id)) {
      warnings.push({
        type: "duplicate-label",
        message: `SymbolMap has a duplicate id "${d.id}".`,
        label: d.label,
      });
    }
    seen.add(d.id);
  }
  return warnings;
}
