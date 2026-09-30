// LineChart `lastPointLabel`: a text label above each series' latest point.
// Pure placement here; renderLastPointLabels draws it as SVG text in every
// renderer mode (inline for svg, in an overlay svg above the canvas otherwise).
import { svgEl } from "../dom";
import { sanitizeForClassName } from "../math/sanitize";
import type { DataPoint, LineChartProps, LineLastPointLabelConfig } from "../types";

export function resolveLastPointLabel(
  v: LineChartProps["lastPointLabel"],
): LineLastPointLabelConfig | null {
  if (!v) return null;
  return v === true ? {} : v;
}

export interface LastPointSeries {
  label: string;
  points: Array<{ x: number; y: number; d: DataPoint }>;
}

export interface LastPointLabel {
  label: string;
  safe: string;
  text: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

export interface LastPointLabelOptions {
  text: (label: string, d: DataPoint) => string;
  measure: (text: string) => number;
  /** Horizontal room the label may use (usually the whole chart width). */
  bounds: { left: number; right: number };
  /** Distance in px between the point and the text baseline. */
  gap: number;
}

export function computeLastPointLabels(
  series: LastPointSeries[],
  o: LastPointLabelOptions,
): LastPointLabel[] {
  const out: LastPointLabel[] = [];
  for (const s of series) {
    if (s.points.length === 0) continue;
    const last = s.points.reduce((a, b) => (b.x > a.x ? b : a));
    const text = o.text(s.label, last.d);
    if (!text) continue;
    // Centred above the point, unless that would cross a chart edge: then the
    // label is pinned to that edge (the latest point usually sits on the right).
    const half = o.measure(text) / 2;
    let anchor: LastPointLabel["anchor"] = "middle";
    let x = last.x;
    if (last.x + half > o.bounds.right) {
      anchor = "end";
      x = o.bounds.right;
    } else if (last.x - half < o.bounds.left) {
      anchor = "start";
      x = o.bounds.left;
    }
    out.push({
      label: s.label,
      safe: sanitizeForClassName(s.label),
      text,
      x,
      y: last.y - o.gap,
      anchor,
    });
  }
  return out;
}

export function renderLastPointLabels(
  parent: SVGElement,
  labels: LastPointLabel[],
  cfg: LineLastPointLabelConfig,
  dimmed: (label: string) => boolean,
): void {
  const g = svgEl("g", { class: "mv-last-point-labels", "pointer-events": "none" });
  for (const l of labels) {
    const t = svgEl("text", {
      class: "mv-last-point-label",
      "data-label": l.label,
      "data-label-safe": l.safe,
      x: l.x,
      y: l.y,
      "text-anchor": l.anchor,
      "pointer-events": "none",
    });
    t.textContent = l.text;
    if (cfg.color) t.style.fill = cfg.color;
    if (cfg.fontSize) t.style.fontSize = `${cfg.fontSize}px`;
    if (dimmed(l.label)) t.style.opacity = "0.05";
    g.appendChild(t);
  }
  parent.appendChild(g);
}
