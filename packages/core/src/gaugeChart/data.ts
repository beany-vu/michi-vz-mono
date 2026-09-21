// Gauge data layer: normalize the dataSet into rings (outer to inner), clamp
// values into [0, max], keep null values as "no data" (track-only rings), and
// drop disabledItems. Pure + DOM-free, so SVG, canvas, and webgpu share one
// source of truth.
import type { GaugeRingDatum } from "../types";

export interface GaugeRing {
  label: string;
  code?: string;
  /** Clamped value in [min, max], or null = no data (track only). */
  value: number | null;
  /** (value - min) / (max - min) in [0, 1], or null = no data. */
  fraction: number | null;
  color?: string;
  trackColor?: string;
  /** Multi-stop colour ramp for this ring's arc, overriding `color`. */
  gradient?: string[];
}

export interface ProcessedGauge {
  /** Rings in dataSet order (outer to inner), disabled removed. */
  rings: GaugeRing[];
  /** Unique ring labels in render order = colour groups. */
  groupKeys: string[];
  /** Explicit colours from each item's `color` field, keyed by label. */
  groupColors: Record<string, string>;
  /** Value at the END of the sweep. */
  max: number;
  /** Value at the START of the sweep (0 unless set, or when the domain collapsed). */
  min: number;
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Position of `value` inside [min, max] as a fraction clamped to [0, 1]. */
export function gaugeFraction(value: number, min: number, max: number): number {
  const f = (value - min) / (max - min);
  return Math.min(1, Math.max(0, f));
}

export function processGaugeData(
  dataSet: GaugeRingDatum[],
  opts: { disabledItems?: string[]; max?: number; min?: number } = {},
): ProcessedGauge {
  const disabled = new Set(opts.disabledItems ?? []);
  const max = finite(opts.max) && opts.max > 0 ? opts.max : 100;
  // A collapsed or reversed domain falls back to 0..max. The warning for it lives
  // in validate/gaugeWarnings.ts so the fallback stays visible to the consumer.
  const requestedMin = finite(opts.min) ? opts.min : 0;
  const min = max > requestedMin ? requestedMin : 0;

  const rings: GaugeRing[] = (dataSet ?? [])
    .filter((d) => !disabled.has(d.label))
    .map((d) => {
      const value = finite(d.value) ? Math.min(max, Math.max(min, d.value)) : null;
      return {
        label: d.label,
        code: d.code,
        value,
        fraction: value === null ? null : gaugeFraction(value, min, max),
        color: d.color,
        trackColor: d.trackColor,
        gradient: d.gradient,
      };
    });

  const groupKeys: string[] = [];
  for (const r of rings) if (!groupKeys.includes(r.label)) groupKeys.push(r.label);

  const groupColors: Record<string, string> = {};
  for (const r of rings) if (r.color && !groupColors[r.label]) groupColors[r.label] = r.color;

  return { rings, groupKeys, groupColors, max, min };
}
