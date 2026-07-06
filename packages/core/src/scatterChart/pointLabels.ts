// Pure layer for ScatterChart `pointLabels`: computes which labels to draw and
// where, given the render model's points (already in the chart's current
// draw/z-order - see renderModel.ts + ScatterChartProps["drawOrder"]).
//
// Placement is intentionally simple - right-of-point, overlap-hide - NOT the
// legacy sdg-trade Scatterplot's d3-voronoi cell-picking (see
// ScatterChartProps["pointLabels"] JSDoc in types.ts for the full parity
// note). No new dependency: bounding-box overlap only, via the existing
// measureLabelWidth house helper (canvas 2D measureText, with a deterministic
// 7px/char fallback in SSR/jsdom - see render/svg/measureLabelWidth.ts).
import { measureLabelWidth } from "../render/svg/measureLabelWidth";
import type { ScatterDataPoint } from "../types";
import type { ScatterPointModel } from "./renderModel";

export interface ScatterPointLabelMark {
  point: ScatterPointModel;
  text: string;
  /** Anchor x (text-anchor "start" - see renderPointLabelsSvg.ts). */
  x: number;
  /** Anchor y (dominant-baseline "middle"). */
  y: number;
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const LABEL_GAP = 4;
// Approximate line height for the point-label text (~1x the 12px base
// font-size). A fixed estimate, not a DOM measurement, so overlap-hide stays
// deterministic in both jsdom and a real browser.
const LABEL_HEIGHT = 12;

function overlaps(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

/**
 * Builds the label marks for `pointLabels`, processing `points` in the exact
 * order given (the render model's current draw order). A point earlier in
 * that order always wins its spot; a later point whose label box would
 * overlap an already-placed label is skipped entirely (no truncation, no
 * repositioning). Because the input order and the geometry are both fully
 * deterministic (no Set/Map/object-key iteration involved), the same input
 * always yields the same set of visible labels.
 */
export function buildScatterPointLabels(
  points: ScatterPointModel[],
  formatter: (d: ScatterDataPoint) => string
): ScatterPointLabelMark[] {
  const placed: Box[] = [];
  const marks: ScatterPointLabelMark[] = [];
  for (const p of points) {
    const text = formatter(p.raw);
    if (!text) continue;
    const width = measureLabelWidth(text);
    const x0 = p.cx + p.r + LABEL_GAP;
    const y0 = p.cy - LABEL_HEIGHT / 2;
    const box: Box = { x0, y0, x1: x0 + width, y1: y0 + LABEL_HEIGHT };
    if (placed.some((b) => overlaps(b, box))) continue;
    placed.push(box);
    marks.push({ point: p, text, x: x0, y: p.cy });
  }
  return marks;
}
