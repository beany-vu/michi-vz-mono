// Gauge data layer: normalize the dataSet into rings (outer to inner), clamp
// values into [0, max], keep null values as "no data" (track-only rings), and
// drop disabledItems. Pure + DOM-free, so SVG, canvas, and webgpu share one
// source of truth.
import type { GaugeRingDatum } from "../types";

export interface GaugeRing {
  label: string;
  code?: string;
  /** Clamped value in [0, max], or null = no data (track only). */
  value: number | null;
  /** value / max in [0, 1], or null = no data. */
  fraction: number | null;
  color?: string;
  trackColor?: string;
}

export interface ProcessedGauge {
  /** Rings in dataSet order (outer to inner), disabled removed. */
  rings: GaugeRing[];
  /** Unique ring labels in render order = colour groups. */
  groupKeys: string[];
  /** Explicit colours from each item's `color` field, keyed by label. */
  groupColors: Record<string, string>;
  max: number;
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function processGaugeData(
  dataSet: GaugeRingDatum[],
  opts: { disabledItems?: string[]; max?: number } = {},
): ProcessedGauge {
  const disabled = new Set(opts.disabledItems ?? []);
  const max = finite(opts.max) && opts.max > 0 ? opts.max : 100;

  const rings: GaugeRing[] = (dataSet ?? [])
    .filter((d) => !disabled.has(d.label))
    .map((d) => {
      const value = finite(d.value) ? Math.min(max, Math.max(0, d.value)) : null;
      return {
        label: d.label,
        code: d.code,
        value,
        fraction: value === null ? null : value / max,
        color: d.color,
        trackColor: d.trackColor,
      };
    });

  const groupKeys: string[] = [];
  for (const r of rings) if (!groupKeys.includes(r.label)) groupKeys.push(r.label);

  const groupColors: Record<string, string> = {};
  for (const r of rings) if (r.color && !groupColors[r.label]) groupColors[r.label] = r.color;

  return { rings, groupKeys, groupColors, max };
}
