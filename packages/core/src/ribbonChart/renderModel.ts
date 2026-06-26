// Renderer-agnostic RibbonChart model: per-date stacked column segments + ribbon
// connector trapezoids linking each key's segment across adjacent dates.
import { sanitizeForClassName } from "../math/sanitize";
import type { RibbonDataRow } from "../types";
import type { RibbonScales } from "./scales";
import type { RibbonColorResolver } from "./colors";

interface Seg {
  key: string;
  date: string;
  colX: number;
  width: number;
  top: number; // yScale(y1)
  bottom: number; // yScale(y0)
  value: number;
}

export interface RibbonColumn {
  key: string;
  safe: string;
  date: string;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  dimmed: boolean;
}

export interface RibbonConnector {
  key: string;
  safe: string;
  path: string;
  color: string;
  dimmed: boolean;
}

export interface RibbonRenderModel {
  columns: RibbonColumn[];
  ribbons: RibbonConnector[];
}

export interface BuildRibbonModelOptions {
  activeKeys: string[];
  columnWidth: number;
  highlightItems: string[];
}

export function buildRibbonRenderModel(
  series: RibbonDataRow[],
  scales: RibbonScales,
  colors: RibbonColorResolver,
  o: BuildRibbonModelOptions
): RibbonRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;
  const bandwidth = scales.xScale.bandwidth();
  const width = Math.min(o.columnWidth, bandwidth);

  // segByDate[date][key] = Seg
  const orderedDates: string[] = [];
  const segByDate = new Map<string, Map<string, Seg>>();

  for (const row of series) {
    const date = String(row.date);
    orderedDates.push(date);
    const colX = (scales.xScale(date) ?? 0) + bandwidth / 2 - width / 2;
    let y0 = 0;
    const map = new Map<string, Seg>();
    for (const key of o.activeKeys) {
      const value = Number(row[key]) || 0;
      const y1 = y0 + value;
      map.set(key, {
        key,
        date,
        colX,
        width,
        top: scales.yScale(y1),
        bottom: scales.yScale(y0),
        value,
      });
      y0 = y1;
    }
    segByDate.set(date, map);
  }

  const dimmedFor = (key: string): boolean => anyHighlight && !highlightSet.has(key);

  const columns: RibbonColumn[] = [];
  for (const date of orderedDates) {
    const map = segByDate.get(date)!;
    for (const key of o.activeKeys) {
      const s = map.get(key)!;
      if (s.value <= 0) continue;
      columns.push({
        key,
        safe: sanitizeForClassName(key),
        date,
        value: s.value,
        x: s.colX,
        y: s.top,
        width: s.width,
        height: Math.max(0, s.bottom - s.top),
        color: colors.getColor(key),
        dimmed: dimmedFor(key),
      });
    }
  }

  // Ribbons between consecutive dates per key.
  const ribbons: RibbonConnector[] = [];
  for (let i = 0; i < orderedDates.length - 1; i++) {
    const a = segByDate.get(orderedDates[i])!;
    const b = segByDate.get(orderedDates[i + 1])!;
    for (const key of o.activeKeys) {
      const sa = a.get(key)!;
      const sb = b.get(key)!;
      if (sa.value <= 0 || sb.value <= 0) continue;
      const rx = sa.colX + sa.width; // right edge of left column
      const lx = sb.colX; // left edge of right column
      const path = `M${rx},${sa.top} L${lx},${sb.top} L${lx},${sb.bottom} L${rx},${sa.bottom} Z`;
      ribbons.push({
        key,
        safe: sanitizeForClassName(key),
        path,
        color: colors.getColor(key),
        dimmed: dimmedFor(key),
      });
    }
  }

  return { columns, ribbons };
}
