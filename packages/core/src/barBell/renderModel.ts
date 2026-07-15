// Renderer-agnostic BarBell model: per row (date), cumulative segments across the
// active keys, each a thin bar + an end-cap circle at its cumulative position.
import { sanitizeForClassName } from "../math/sanitize";
import { computeCircleDodgeOffsets } from "./computeCircleDodge";
import type { BarBellDataRow } from "../types";
import type { BarBellScales } from "./scales";
import type { BarBellColorResolver } from "./colors";

// Legacy fixed marks (BarBellChart canvas hook): a 4px bar + a 6px end-cap radius.
const BAR_HEIGHT = 4;
const CIRCLE_RADIUS = 6;

export interface BarBellSegment {
  key: string;
  safe: string;
  date: string;
  value: number;
  x: number;
  width: number;
  cx: number;
  /** Row centre line - the BAR sits here (all bars aligned on one line). */
  cy: number;
  /** End-cap centre y - equals cy unless dodged (then it fans off the line). */
  capCy: number;
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
  /**
   * Vertically spread end-caps that pile at the same x (zero-width segments) so each
   * stays visible, centred on the row line. The engine defaults this ON (legacy
   * parity); pass false to keep overlapping caps stacked.
   */
  dodgeOverlappingCaps?: boolean;
}

export function buildBarBellRenderModel(
  dataSet: BarBellDataRow[],
  scales: BarBellScales,
  colors: BarBellColorResolver,
  o: BuildBarBellModelOptions,
): BarBellRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;
  const bandwidth = scales.yScale.bandwidth();
  const barHeight = BAR_HEIGHT;
  const capRadius = CIRCLE_RADIUS;

  const segments: BarBellSegment[] = [];
  for (const row of dataSet) {
    const date = String(row.date);
    const rowMid = (scales.yScale(date) ?? 0) + bandwidth / 2;
    let cum = 0;
    const rowSegs: BarBellSegment[] = [];
    for (const key of o.activeKeys) {
      const value = Number(row[key]) || 0;
      const x0 = scales.xScale(cum);
      cum += value;
      const x1 = scales.xScale(cum);
      rowSegs.push({
        key,
        safe: sanitizeForClassName(key),
        date,
        value,
        x: x0,
        width: Math.max(0, x1 - x0),
        cx: x1,
        cy: rowMid,
        capCy: rowMid,
        color: colors.getColor(key),
        dimmed: anyHighlight && !highlightSet.has(key),
      });
    }
    // Opt-in: dodge ONLY the end-caps (capCy) that pile at the same x so each stays
    // visible, fanned vertically + centred on the row line; the BARS (cy) stay on the
    // line so all rects remain aligned. Bounded to the row's y-band. Mirrors legacy.
    if (o.dodgeOverlappingCaps) {
      const dodge = computeCircleDodgeOffsets(
        rowSegs.map((s) => s.cx),
        capRadius,
        bandwidth,
      );
      rowSegs.forEach((s, i) => {
        s.capCy = rowMid + dodge[i];
      });
    }
    segments.push(...rowSegs);
  }

  return { segments, barHeight, capRadius };
}
