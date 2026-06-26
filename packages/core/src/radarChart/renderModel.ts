// Renderer-agnostic RadarChart model: polar grid (rings + spokes + axis labels)
// and one polygon (+ pole points) per series. All geometry in pixel space.
import { sanitizeForClassName } from "../math/sanitize";
import type { Margin, RadarDataItem } from "../types";
import type { RadarColorResolver } from "./colors";

export interface RadarPole {
  x: number;
  y: number;
  value: number;
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
  /** concentric ring polygon point strings, inner→outer. */
  rings: string[];
  spokes: Array<{ x: number; y: number }>; // outer vertex per axis
  axisLabels: Array<{ x: number; y: number; text: string; anchor: "start" | "middle" | "end" }>;
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

  // Grid
  const rings: string[] = [];
  for (let ring = 1; ring <= o.rings; ring++) {
    const rr = (ring / o.rings) * radius;
    rings.push(o.axes.map((_, i) => { const p = pt(rr, i); return `${p.x},${p.y}`; }).join(" "));
  }
  const spokes = o.axes.map((_, i) => pt(radius, i));
  const axisLabels = o.axes.map((axis, i) => {
    const p = pt(radius + 14, i);
    const cos = Math.cos(angleOf(i));
    const anchor: "start" | "middle" | "end" = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
    return { x: p.x, y: p.y, text: axis, anchor };
  });

  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;

  const series: RadarSeriesModel[] = items.map((it) => {
    const poles: RadarPole[] = o.axes.map((_, i) => {
      const value = Number(it.values[i]) || 0;
      const p = pt(rOf(value), i);
      return { x: p.x, y: p.y, value };
    });
    return {
      label: it.label,
      safe: sanitizeForClassName(it.label),
      color: colors.getColor(it.label),
      points: poles.map((p) => `${p.x},${p.y}`).join(" "),
      poles,
      dimmed: anyHighlight && !highlightSet.has(it.label),
    };
  });

  return { grid: { cx, cy, radius, rings, spokes, axisLabels }, series };
}
