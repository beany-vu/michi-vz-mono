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
  /** Anchor x. With textAnchor "start" the label extends right of it; with "end"
   * (flipped near the plot's right edge) it extends left. See renderPointLabelsSvg.ts. */
  x: number;
  /** Anchor y (dominant-baseline "middle"). */
  y: number;
  /** SVG text-anchor: "start" = label to the RIGHT of the point (default);
   * "end" = flipped to the LEFT so an edge-hugging label isn't clipped. */
  textAnchor: "start" | "end";
}

export interface ScatterPointLabelBounds {
  /** Left edge of the plot area (margin.left) - a flipped-left label shouldn't spill past it. */
  plotLeft: number;
  /** Right edge of the plot area (width - margin.right) - a right-side label that would
   * cross this flips to the left of its point instead of being cropped off the chart. */
  plotRight: number;
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
 *
 * When `bounds` is given, a label whose right-side placement would cross the
 * plot's right edge flips to the LEFT of its point (text-anchor "end") - so a
 * point hugging the right axis (e.g. a dominant "Developing regions" bubble)
 * keeps its label on-chart instead of having it cropped. Omitting `bounds`
 * preserves the original always-right behaviour exactly.
 */
export function buildScatterPointLabels(
  points: ScatterPointModel[],
  formatter: (d: ScatterDataPoint) => string,
  bounds?: ScatterPointLabelBounds
): ScatterPointLabelMark[] {
  const placed: Box[] = [];
  const marks: ScatterPointLabelMark[] = [];
  for (const p of points) {
    const text = formatter(p.raw);
    if (!text) continue;
    const width = measureLabelWidth(text);
    const y0 = p.cy - LABEL_HEIGHT / 2;

    // Default placement: to the RIGHT of the point (anchor "start").
    const rightX = p.cx + p.r + LABEL_GAP;
    // Flip LEFT (anchor "end") only when the right label would cross the plot's
    // right edge AND the flipped label still fits within the left edge - otherwise
    // keep it right (a too-wide label has nowhere better to go).
    const leftAnchorX = p.cx - p.r - LABEL_GAP;
    const flipLeft =
      bounds != null &&
      rightX + width > bounds.plotRight &&
      leftAnchorX - width >= bounds.plotLeft;

    const anchorX = flipLeft ? leftAnchorX : rightX;
    const textAnchor: "start" | "end" = flipLeft ? "end" : "start";
    // Box spans the text extent on whichever side it was placed, for overlap-hide.
    const boxX0 = flipLeft ? leftAnchorX - width : rightX;
    const box: Box = { x0: boxX0, y0, x1: boxX0 + width, y1: y0 + LABEL_HEIGHT };
    if (placed.some((b) => overlaps(b, box))) continue;
    placed.push(box);
    marks.push({ point: p, text, x: anchorX, y: p.cy, textAnchor });
  }
  return marks;
}
