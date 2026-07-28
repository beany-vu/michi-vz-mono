// onDataWarning checks for Gauge: empty dataset, non-finite non-null values,
// values outside [0, max] (clamped), and duplicate ring labels (which would
// collide on the colour key).
import type { DataWarning, GaugeRingDatum } from "../types";

export function checkGaugeData(dataSet: GaugeRingDatum[], max = 100): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "Gauge chart received an empty dataSet." });
    return warnings;
  }
  const seen = new Set<string>();
  for (const d of dataSet) {
    if (d.value !== null && d.value !== undefined && !Number.isFinite(Number(d.value))) {
      warnings.push({
        type: "non-finite-value",
        message: `Gauge ring "${d.label}" has a non-finite value; it renders as no data.`,
        label: d.label,
      });
    } else if (d.value !== null && d.value !== undefined && (d.value < 0 || d.value > max)) {
      warnings.push({
        type: "non-finite-value",
        message: `Gauge ring "${d.label}" value ${d.value} is outside [0, ${max}]; it is clamped.`,
        label: d.label,
      });
    }
    if (seen.has(d.label)) {
      warnings.push({
        type: "duplicate-label",
        message: `Gauge has a duplicate ring label "${d.label}".`,
        label: d.label,
      });
    }
    seen.add(d.label);
  }
  return warnings;
}
