// Renderer-agnostic Gauge model - consumed by SVG, canvas, webgpu, hit-test, and
// context. One mark per ring: a centreline radius + sweep + resolved styling.
// Geometry is centred at (cx,cy); angles are radians CLOCKWISE from 12 o'clock
// (the pie convention). Active emphasis is resolved HERE so every renderer and
// the centre label agree on it.
import { sanitizeForClassName } from "../math/sanitize";
import type { GaugeActiveStyle } from "../types";
import type { GaugeColorResolver } from "./colors";
import type { GaugeRing } from "./data";

export interface GaugeRingMark {
  label: string;
  code?: string;
  /** Colour-group key (the ring label). */
  colorKey: string;
  /** sanitizeForClassName(label) - the colour contract. */
  dataLabelSafe: string;
  /** Resolved arc colour. */
  stroke: string;
  /** Resolved track colour. */
  trackColor: string;
  /** Arc opacity after base/active resolution. */
  opacity: number;
  /** Track opacity after base/active resolution. */
  trackOpacity: number;
  /** Centreline radius in px. */
  radius: number;
  /** Stroke thickness in px. */
  thickness: number;
  /** Clamped value or null (track only). */
  value: number | null;
  /** value/max in [0,1] or null. */
  fraction: number | null;
  /** Sweep start in radians, clockwise from 12 o'clock. */
  startAngle: number;
  /** Sweep length in radians (0 for null-value rings). */
  sweep: number;
  /** Ring index in dataSet order (0 = outermost). */
  index: number;
  active: boolean;
  /** Multi-stop colour ramp for the arc (ring value wins over the chart-level
   * default), or undefined for a solid `stroke`. */
  gradient?: string[];
}

export interface GaugeRenderModel {
  cx: number;
  cy: number;
  rings: GaugeRingMark[];
  groupKeys: string[];
  roundedCaps: boolean;
  max: number;
  /** Index (into rings) of the active ring, or null. */
  activeIndex: number | null;
  /** Angular extent of the gauge in radians, clockwise from startAngle (default TAU
   * = a full circle). Both the track and every ring's sweep are measured against it. */
  sweepAngle: number;
  /** Id prefix unique to this mounted chart, used to namespace generated SVG defs
   * (e.g. gradients) so multiple gauges on one page never collide. */
  gradientIdBase: string;
}

export interface BuildGaugeModelOptions {
  cx: number;
  cy: number;
  outerRadius: number;
  ringThickness: number;
  ringGap: number;
  startAngleDeg: number;
  /** Angular extent in degrees, clockwise from startAngle (default 360). Clamped
   * to (0, 360]. */
  sweepAngleDeg?: number;
  roundedCaps: boolean;
  max: number;
  ringOpacity: number | number[];
  trackColor: string | string[];
  trackOpacity: number | number[];
  activeStyle: GaugeActiveStyle;
  /** Resolved active ring index (hover > highlightItems > defaultActive), or null. */
  activeIndex: number | null;
  highlightItems: string[];
  /** Chart-level colour ramp; a ring's own `gradient` wins. */
  gradient?: string[];
  /** Id prefix unique to this mounted chart (see GaugeRenderModel.gradientIdBase). */
  gradientIdBase: string;
}

/** Per-ring value from a scalar-or-array config prop. */
function perRing<T>(v: T | T[], i: number, fallback: T): T {
  if (Array.isArray(v)) return v[i] ?? fallback;
  return v ?? fallback;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function buildGaugeRenderModel(
  rings: GaugeRing[],
  colors: GaugeColorResolver,
  o: BuildGaugeModelOptions,
): GaugeRenderModel {
  const startAngle = (o.startAngleDeg * Math.PI) / 180;
  // Clamped to (0, 360]: an unset/invalid value falls back to a full circle.
  const sweepAngleDeg =
    o.sweepAngleDeg === undefined || !Number.isFinite(o.sweepAngleDeg) || o.sweepAngleDeg <= 0
      ? 360
      : clamp(o.sweepAngleDeg, Number.EPSILON, 360);
  const sweepAngle = (sweepAngleDeg * Math.PI) / 180;
  const highlightSet = new Set(o.highlightItems);
  const marks: GaugeRingMark[] = [];

  rings.forEach((r, i) => {
    const radius = o.outerRadius - o.ringThickness / 2 - i * (o.ringThickness + o.ringGap);
    if (radius <= 0) return; // too many rings for the box - skip silently (warned in validate)
    const active = o.activeIndex === i || highlightSet.has(r.label);
    const baseOpacity = perRing(o.ringOpacity, i, 1);
    const baseTrackOpacity = perRing(o.trackOpacity, i, 1);
    marks.push({
      label: r.label,
      code: r.code,
      colorKey: r.label,
      dataLabelSafe: sanitizeForClassName(r.label),
      stroke: colors.getColor(r.label),
      trackColor: r.trackColor ?? perRing(o.trackColor, i, "#00000014"),
      opacity: active ? (o.activeStyle.opacity ?? 1) : baseOpacity,
      trackOpacity: active ? (o.activeStyle.trackOpacity ?? baseTrackOpacity) : baseTrackOpacity,
      radius,
      thickness: o.ringThickness,
      value: r.value,
      fraction: r.fraction,
      startAngle,
      sweep: r.fraction === null ? 0 : r.fraction * sweepAngle,
      index: i,
      active,
      gradient: r.gradient ?? o.gradient,
    });
  });

  return {
    cx: o.cx,
    cy: o.cy,
    rings: marks,
    groupKeys: [...new Set(marks.map((m) => m.colorKey))],
    roundedCaps: o.roundedCaps,
    max: o.max,
    activeIndex: o.activeIndex,
    sweepAngle,
    gradientIdBase: o.gradientIdBase,
  };
}
