// Renderer-agnostic BarBell model: per row (date), cumulative segments across the
// active keys, each a thin bar + an end-cap circle at its cumulative position.
import { sanitizeForClassName } from "../math/sanitize";
import type { BarBellDataRow } from "../types";
import type { BarBellScales } from "./scales";
import type { BarBellColorResolver } from "./colors";

export interface BarBellSegment {
  key: string;
  safe: string;
  date: string;
  value: number;
  x: number;
  width: number;
  cx: number;
  cy: number;
  color: string;
  dimmed: boolean;
}

export interface BarBellRenderModel {
  segments: BarBellSegment[];
  barHeight: number;
  capRadius: number;
}

export interface BuildBarBellModelOptions {
  activeKeys: string[];
  highlightItems: string[];
}

export function buildBarBellRenderModel(
  dataSet: BarBellDataRow[],
  scales: BarBellScales,
  colors: BarBellColorResolver,
  o: BuildBarBellModelOptions
): BarBellRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;
  const bandwidth = scales.yScale.bandwidth();
  const barHeight = Math.max(2, Math.min(bandwidth, 8));
  const capRadius = Math.max(3, Math.min(bandwidth / 2, 6));

  const segments: BarBellSegment[] = [];
  for (const row of dataSet) {
    const date = String(row.date);
    const cy = (scales.yScale(date) ?? 0) + bandwidth / 2;
    let cum = 0;
    for (const key of o.activeKeys) {
      const value = Number(row[key]) || 0;
      const x0 = scales.xScale(cum);
      cum += value;
      const x1 = scales.xScale(cum);
      segments.push({
        key,
        safe: sanitizeForClassName(key),
        date,
        value,
        x: x0,
        width: Math.max(0, x1 - x0),
        cx: x1,
        cy,
        color: colors.getColor(key),
        dimmed: anyHighlight && !highlightSet.has(key),
      });
    }
  }

  return { segments, barHeight, capRadius };
}
