// Pure annotation layout for the Gauge: value markers (per ring), reference
// ticks and end labels (per scale, on the OUTER ring). Consumed by the ONE svg
// annotation renderer in every renderer mode. Angles in RADIANS clockwise from
// 12 o'clock; a point at radius r and angle a is (cx + r sin a, cy - r cos a).
import { gaugeFraction } from "./data";
import type { GaugeEndLabel, GaugeTick, GaugeValueMarker } from "../types";

/** Tick line: from the outer edge + inner to + outer (px). */
export const GAUGE_TICK_INNER = 2;
export const GAUGE_TICK_OUTER = 9;
/** Tick label anchor distance from the outer edge (px). */
export const GAUGE_TICK_LABEL = 26;
/** End-label offset past the arc end along the continued tangent (px). */
export const GAUGE_END_LABEL_OFFSET = 20;
/** Band reserved around a sweep-fitted gauge while ticks or end labels exist (px). */
export const GAUGE_ANNOTATION_RESERVE = 36;

const TAU = Math.PI * 2;
const MARKER_DEFAULTS = { radius: 8, stroke: "#fff", strokeWidth: 2.5 };
const MARKER_TICK_DEFAULTS = { length: 20, color: "#1a1a1a", width: 1.5 };
const TICK_COLOR = "#9ea3ae";

/** The slice of a ring mark the annotations need (structural, no import from renderModel). */
export interface GaugeAnnotationRing {
  index: number;
  /** Centreline radius in px. */
  radius: number;
  /** (value - min) / (max - min) in [0, 1], or null for a track-only ring. */
  fraction: number | null;
  /** Resolved arc colour. */
  stroke: string;
  colorKey: string;
  dataLabelSafe: string;
}

export interface GaugeMarkerMark {
  ringIndex: number;
  dataLabel: string;
  dataLabelSafe: string;
  x: number;
  y: number;
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  tick: { x1: number; y1: number; x2: number; y2: number; color: string; width: number } | null;
}

export interface GaugeTickMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Label anchor (caption goes 6px above, value 7px below). */
  labelX: number;
  labelY: number;
  /** Radians clockwise from 12 o'clock. */
  angle: number;
  label?: string;
  valueLabel?: string;
  color: string;
}

export interface GaugeEndLabelMark {
  end: "min" | "max";
  x: number;
  y: number;
  label?: string;
  valueLabel?: string;
}

export interface GaugeAnnotations {
  markers: GaugeMarkerMark[];
  ticks: GaugeTickMark[];
  endLabels: GaugeEndLabelMark[];
}

export function emptyGaugeAnnotations(): GaugeAnnotations {
  return { markers: [], ticks: [], endLabels: [] };
}

export function hasGaugeAnnotations(a: GaugeAnnotations): boolean {
  return a.markers.length > 0 || a.ticks.length > 0 || a.endLabels.length > 0;
}

export interface BuildGaugeAnnotationsInput {
  cx: number;
  cy: number;
  /** Outer edge radius of the outermost ring (px). */
  outerRadius: number;
  /** Radians, clockwise from 12 o'clock. */
  startAngle: number;
  sweepAngle: number;
  min: number;
  max: number;
  rings: GaugeAnnotationRing[];
  ticks?: GaugeTick[];
  endLabels?: boolean | { min?: GaugeEndLabel; max?: GaugeEndLabel };
  valueMarker?: boolean | GaugeValueMarker;
  valueFormatter: (v: number) => string;
}

/** A label line: the consumer string wins; "" suppresses; otherwise the formatter. */
function resolveValueLabel(
  given: string | undefined,
  value: number,
  fmt: (v: number) => string,
): string | undefined {
  if (given === "") return undefined;
  return given ?? fmt(value);
}

export function buildGaugeAnnotations(i: BuildGaugeAnnotationsInput): GaugeAnnotations {
  const out = emptyGaugeAnnotations();
  const pt = (r: number, a: number): [number, number] => [
    i.cx + r * Math.sin(a),
    i.cy - r * Math.cos(a),
  ];
  const angleOf = (fraction: number): number => i.startAngle + fraction * i.sweepAngle;

  // ----- Markers: one per ring with data -----
  if (i.valueMarker) {
    const cfg = i.valueMarker === true ? {} : i.valueMarker;
    const tickCfg =
      cfg.tick === false
        ? null
        : { ...MARKER_TICK_DEFAULTS, ...(cfg.tick === true ? {} : (cfg.tick ?? {})) };
    for (const ring of i.rings) {
      if (ring.fraction === null) continue;
      const a = angleOf(ring.fraction);
      const [x, y] = pt(ring.radius, a);
      let tick: GaugeMarkerMark["tick"] = null;
      if (tickCfg) {
        const [x1, y1] = pt(ring.radius - tickCfg.length / 2, a);
        const [x2, y2] = pt(ring.radius + tickCfg.length / 2, a);
        tick = { x1, y1, x2, y2, color: tickCfg.color, width: tickCfg.width };
      }
      out.markers.push({
        ringIndex: ring.index,
        dataLabel: ring.colorKey,
        dataLabelSafe: ring.dataLabelSafe,
        x,
        y,
        radius: cfg.radius ?? MARKER_DEFAULTS.radius,
        fill: cfg.fill ?? ring.stroke,
        stroke: cfg.stroke ?? MARKER_DEFAULTS.stroke,
        strokeWidth: cfg.strokeWidth ?? MARKER_DEFAULTS.strokeWidth,
        tick,
      });
    }
  }

  // ----- Reference ticks: on the outer edge -----
  for (const t of i.ticks ?? []) {
    if (!Number.isFinite(t.value)) continue;
    const fraction = gaugeFraction(t.value, i.min, i.max);
    // Clamp the raw value (not min + fraction * span): the multiply-add can leave
    // floating noise like 7.270000000000001 in a label that should read 7.27.
    const clamped = Math.min(i.max, Math.max(i.min, t.value));
    const a = angleOf(fraction);
    const [x1, y1] = pt(i.outerRadius + GAUGE_TICK_INNER, a);
    const [x2, y2] = pt(i.outerRadius + GAUGE_TICK_OUTER, a);
    const [labelX, labelY] = pt(i.outerRadius + GAUGE_TICK_LABEL, a);
    out.ticks.push({
      x1,
      y1,
      x2,
      y2,
      labelX,
      labelY,
      angle: a,
      label: t.label,
      valueLabel: resolveValueLabel(t.valueLabel, clamped, i.valueFormatter),
      color: t.color ?? TICK_COLOR,
    });
  }

  // ----- End labels: only on a partial sweep, on the OUTER centreline -----
  const isFull = i.sweepAngle >= TAU - 1e-9;
  if (i.endLabels && !isFull) {
    const cfg = i.endLabels === true ? {} : i.endLabels;
    const centreline = i.rings.length ? Math.max(...i.rings.map((r) => r.radius)) : i.outerRadius;
    const a0 = i.startAngle;
    const a1 = i.startAngle + i.sweepAngle;
    const [sx, sy] = pt(centreline, a0);
    const [ex, ey] = pt(centreline, a1);
    // Tangent of the arc continued PAST each end: before the start the angle
    // decreases, so the direction is -(cos a, sin a); after the end it increases.
    out.endLabels.push({
      end: "min",
      x: sx - GAUGE_END_LABEL_OFFSET * Math.cos(a0),
      y: sy - GAUGE_END_LABEL_OFFSET * Math.sin(a0),
      label: cfg.min?.label,
      valueLabel: resolveValueLabel(cfg.min?.valueLabel, i.min, i.valueFormatter),
    });
    out.endLabels.push({
      end: "max",
      x: ex + GAUGE_END_LABEL_OFFSET * Math.cos(a1),
      y: ey + GAUGE_END_LABEL_OFFSET * Math.sin(a1),
      label: cfg.max?.label,
      valueLabel: resolveValueLabel(cfg.max?.valueLabel, i.max, i.valueFormatter),
    });
  }

  return out;
}
