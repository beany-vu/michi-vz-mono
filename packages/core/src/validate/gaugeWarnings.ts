// onDataWarning checks for Gauge: empty dataset, non-finite non-null values,
// values outside [min, max] (clamped), and duplicate ring labels (which would
// collide on the colour key).
import { isFullSweepDeg } from "../gaugeChart/geometry";
import type { DataWarning, GaugeRingDatum, GaugeChartProps, GaugeTick } from "../types";

export function checkGaugeData(dataSet: GaugeRingDatum[], max = 100, min = 0): DataWarning[] {
  const warnings: DataWarning[] = [];
  const effectiveMax = Number.isFinite(max) && max > 0 ? max : 100;
  // Mirror the data layer (gaugeChart/data.ts): a non-finite min is not a broken
  // domain, it is simply 0 - so it must not raise the "not below max" warning.
  const requestedMin = Number.isFinite(min) ? min : 0;
  const domainOk = effectiveMax > requestedMin;
  if (!domainOk) {
    warnings.push({
      type: "non-finite-value",
      message: `Gauge min ${min} is not below max ${max}; the scale falls back to 0..${effectiveMax}.`,
    });
  }
  const lo = domainOk ? requestedMin : 0;
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
    } else if (
      d.value !== null &&
      d.value !== undefined &&
      (d.value < lo || d.value > effectiveMax)
    ) {
      warnings.push({
        type: "non-finite-value",
        message: `Gauge ring "${d.label}" value ${d.value} is outside [${lo}, ${effectiveMax}]; it is clamped.`,
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

/** Warnings for the positioning props: ticks outside [min, max] (clamped) and end
 *  labels on a full ring (both ends coincide, so they are skipped). */
export function checkGaugeAnnotations(o: {
  ticks?: GaugeTick[];
  endLabels?: GaugeChartProps["endLabels"];
  min: number;
  max: number;
  sweepAngleDeg?: number;
}): DataWarning[] {
  const warnings: DataWarning[] = [];
  for (const t of o.ticks ?? []) {
    if (!Number.isFinite(t.value)) {
      warnings.push({
        type: "non-finite-value",
        message: `Gauge tick "${t.label ?? t.value}" has a non-finite value; it is skipped.`,
        label: t.label,
      });
    } else if (t.value < o.min || t.value > o.max) {
      warnings.push({
        type: "non-finite-value",
        message: `Gauge tick "${t.label ?? t.value}" value ${t.value} is outside [${o.min}, ${o.max}]; it is clamped to the nearest end.`,
        label: t.label,
      });
    }
  }
  if (o.endLabels && isFullSweepDeg(o.sweepAngleDeg)) {
    warnings.push({
      type: "layout-overflow",
      message:
        "Gauge endLabels are ignored on a full 360 degree ring because both ends coincide; set sweepAngle below 360.",
    });
  }
  return warnings;
}
