// onDataWarning checks for LineChart: empty dataset, non-finite values, and
// per-series duplicate / non-monotonic dates (parsed in axis units). Mirrors the
// gap-chart checkGapData style.
import { parseAxisUnit } from "../lineChart/detectGaps";
import type { DataWarning, LineDataItem, XaxisDataType } from "../types";

export function checkLineData(
  dataSet: LineDataItem[],
  xAxisDataType: XaxisDataType
): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "LineChart received an empty dataSet." });
    return warnings;
  }

  for (const item of dataSet) {
    let prevUnit = -Infinity;
    const seen = new Set<number>();
    for (const d of item.series) {
      if (!Number.isFinite(d.value)) {
        warnings.push({
          type: "non-finite-value",
          message: `Series "${item.label}" has a non-finite value at ${String(d.date)}.`,
          label: item.label,
        });
      }
      const u = parseAxisUnit(d.date, xAxisDataType);
      if (Number.isFinite(u)) {
        if (seen.has(u)) {
          warnings.push({
            type: "duplicate-date",
            message: `Series "${item.label}" has a duplicate date ${String(d.date)}.`,
            label: item.label,
          });
        }
        seen.add(u);
        if (u < prevUnit) {
          warnings.push({
            type: "non-monotonic-date",
            message: `Series "${item.label}" is not sorted ascending at ${String(d.date)}.`,
            label: item.label,
          });
        }
        prevUnit = u;
      }
    }
  }
  return warnings;
}
