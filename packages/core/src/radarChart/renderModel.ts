// Renderer-agnostic RadarChart model: polar grid (rings + spokes + axis labels)
// and one polygon (+ pole points) per series. All geometry in pixel space.
import { sanitizeForClassName } from "../math/sanitize";
import type { Margin, RadarDataItem } from "../types";
import type { RadarColorResolver } from "./colors";

export interface RadarPole {
  x: number;
  y: number;
  value: number;
  /** the axis (pole) index this point sits on (poles may be sparse - absent axes skipped). */
  axisIndex: number;
}

export interface RadarSeriesModel {
  label: string;
  safe: string;
  color: string;
  /** "x,y x,y ..." polygon points. */
  points: string;
  poles: RadarPole[];
  dimmed: boolean;
}

export interface RadarGrid {
  cx: number;
  cy: number;
  radius: number;
  /** concentric ring radii (pixels), inner→outer - drawn as dashed circles. */
  rings: number[];
  spokes: Array<{ x: number; y: number }>; // outer vertex per axis
  axisLabels: Array<{ x: number; y: number; text: string; anchor: "start" | "middle" | "end" }>;
  /** one value label per ring, placed along the top (axis 0) spoke. */
  radialLabels: Array<{ x: number; y: number; text: string }>;
}

export interface RadarRenderModel {
  grid: RadarGrid;
  series: RadarSeriesModel[];
}

export interface BuildRadarModelOptions {
  axes: string[];
  maxValue: number;
  rings: number;
  width: number;
  height: number;
  margin: Margin;
  highlightItems: string[];
  poleLabelFormatter?: (axis: string) => string;
  radialLabelFormatter?: (value: number) => string;
  /** Floor for axis-label y (px). The engine passes the title band's bottom edge when a
   * title is rendered, so the top pole's label can't climb into the title. */
  minLabelY?: number;
}

export function buildRadarRenderModel(
  items: RadarDataItem[],
  colors: RadarColorResolver,
  o: BuildRadarModelOptions
): RadarRenderModel {
  const plotW = o.width - o.margin.left - o.margin.right;
  const plotH = o.height - o.margin.top - o.margin.bottom;
  const cx = o.margin.left + plotW / 2;
  const cy = o.margin.top + plotH / 2;
  const radius = Math.max(0, Math.min(plotW, plotH) / 2);
  const n = o.axes.length;

  const angleOf = (i: number): number => (i / n) * 2 * Math.PI - Math.PI / 2;
  const rOf = (value: number): number => (o.maxValue > 0 ? (value / o.maxValue) * radius : 0);
  const pt = (r: number, i: number): { x: number; y: number } => ({
    x: cx + r * Math.cos(angleOf(i)),
    y: cy + r * Math.sin(angleOf(i)),
  });

  // Grid - concentric ring RADII (drawn as dashed circles, legacy parity).
  const rings: number[] = [];
  for (let ring = 1; ring <= o.rings; ring++) {
    rings.push((ring / o.rings) * radius);
  }
  const spokes = o.axes.map((_, i) => pt(radius, i));
  const axisLabels = o.axes.map((axis, i) => {
    // Labels sit near the plot edge (legacy placed them ~5px inside the SVG edge,
    // i.e. radius+25 here) - relies on the SVG being overflow:visible so they don't clip.
    const p = pt(radius + 25, i);
    const cos = Math.cos(angleOf(i));
    const anchor: "start" | "middle" | "end" = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
    // Keep upward-overshooting labels (the straight-up pole especially) out of the
    // title band; side/bottom labels are already lower so the clamp is a no-op there.
    const y = o.minLabelY !== undefined ? Math.max(p.y, o.minLabelY) : p.y;
    return { x: p.x, y, text: o.poleLabelFormatter ? o.poleLabelFormatter(axis) : axis, anchor };
  });
  // Radial (ring-value) labels along the top spoke (axis 0 points straight up).
  const radialLabels: Array<{ x: number; y: number; text: string }> = [];
  for (let ring = 1; ring <= o.rings; ring++) {
    const rr = (ring / o.rings) * radius;
    const value = (ring / o.rings) * o.maxValue;
    const p = pt(rr, 0);
    radialLabels.push({
      x: p.x,
      y: p.y,
      text: o.radialLabelFormatter ? o.radialLabelFormatter(value) : String(Math.round(value)),
    });
  }

  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;

  const series: RadarSeriesModel[] = items.map((it) => {
    // Skip axes whose value is null (the month is ABSENT from the data) so the polygon
    // doesn't spike to the centre - mirrors the legacy projectSeries skip. A present 0
    // still plots at the centre (genuine zero).
    const poles: RadarPole[] = [];
    o.axes.forEach((_, i) => {
      const raw = it.values[i];
      if (raw == null) return;
      const value = Number(raw) || 0;
      const p = pt(rOf(value), i);
      poles.push({ x: p.x, y: p.y, value, axisIndex: i });
    });
    return {
      label: it.label,
      safe: sanitizeForClassName(it.label),
      color: colors.getColor(it.label),
      points: poles.map((p) => `${p.x},${p.y}`).join(" "),
      poles,
      // Highlight takes precedence: when something is highlighted, dim the rest;
      // otherwise honour the per-series `dimmed` flag (e.g. a non-current year).
      dimmed: anyHighlight ? !highlightSet.has(it.label) : Boolean(it.dimmed),
    };
  });

  return { grid: { cx, cy, radius, rings, spokes, axisLabels, radialLabels }, series };
}
