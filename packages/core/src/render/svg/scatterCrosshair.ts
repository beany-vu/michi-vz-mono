// Crosshair overlay for ScatterPlot: two SVG lines + optional axis-badge value
// readouts, tracking the hovered bubble. A faithful port of the legacy
// ScatterPlotChart CrosshairOverlay / CrosshairAxisBadge / crosshairBadgePlacement.
// Drawn into a dedicated SVG group; in canvas mode that group lives on an overlay
// <svg> layered ABOVE the canvas so the crosshair sits on top of the bubbles.
import { svgEl } from "../../dom";
import type { Margin } from "../../types";

export const CROSSHAIR_BADGE_HEIGHT = 18;

export interface CrosshairBadgeArgs {
  axis: "x" | "y";
  cx: number;
  cy: number;
  r: number;
  badgeW: number;
  margin: Margin;
  width: number;
  height: number;
  placement: "auto" | "fixed";
}

/** Pure: returns the SVG anchor {x,y} for an axis badge (legacy parity). */
export function resolveCrosshairBadgePlacement(a: CrosshairBadgeArgs): { x: number; y: number } {
  const { axis, cx, cy, r, badgeW, margin, width, height, placement } = a;
  if (axis === "y") {
    if (placement === "fixed") return { x: margin.left, y: cy };
    const flip = cx - r < margin.left + badgeW / 2 || margin.left - badgeW / 2 < 0;
    return { x: flip ? width - margin.right : margin.left, y: cy };
  }
  // axis === "x"
  if (placement === "fixed") return { x: cx, y: height - margin.bottom };
  const overlapsBubble = cy + r > height - margin.bottom - CROSSHAIR_BADGE_HEIGHT / 2;
  return { x: cx, y: overlapsBubble ? margin.top : height - margin.bottom };
}

function makeBadge(
  axis: "x" | "y",
  label: string,
  color: string,
  cx: number,
  cy: number,
  r: number,
  margin: Margin,
  width: number,
  height: number,
  placement: "auto" | "fixed",
): SVGGElement {
  const badgeW = Math.max(28, label.length * 6 + 16);
  const { x, y } = resolveCrosshairBadgePlacement({
    axis,
    cx,
    cy,
    r,
    badgeW,
    margin,
    width,
    height,
    placement,
  });
  const g = svgEl("g", {
    class: `mv-crosshair-badge mv-crosshair-badge-${axis}`,
    "pointer-events": "none",
  }) as SVGGElement;
  g.appendChild(
    svgEl("rect", {
      x: x - badgeW / 2,
      y: y - CROSSHAIR_BADGE_HEIGHT / 2,
      width: badgeW,
      height: CROSSHAIR_BADGE_HEIGHT,
      fill: "white",
      "fill-opacity": 0.92,
      stroke: color,
      "stroke-width": 1,
      rx: 4,
    }),
  );
  const text = svgEl("text", {
    x,
    y,
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    "font-size": 10,
    fill: color,
    "pointer-events": "none",
  });
  text.textContent = label;
  g.appendChild(text);
  return g;
}

export interface DrawCrosshairOptions {
  margin: Margin;
  width: number;
  height: number;
  dashed: boolean;
  showLabels: boolean;
  span: "full" | "half";
  placement: "auto" | "fixed";
  xLabel: string;
  yLabel: string;
  opacity: number;
}

/** Redraw the crosshair group for a point (cx/cy/r/color). Clears prior content. */
export function drawCrosshair(
  g: SVGGElement,
  cx: number,
  cy: number,
  r: number,
  color: string,
  o: DrawCrosshairOptions,
): void {
  clearCrosshair(g);
  const { margin, width, height, dashed, showLabels, span, placement, xLabel, yLabel, opacity } = o;
  const dash = dashed ? "4 4" : undefined;
  const half = span === "half";

  // Vertical line: x1=x2=cx; from top (or the bubble, when "half") down to the x-axis.
  g.appendChild(
    svgEl("line", {
      "data-crosshair-line": "x",
      x1: cx,
      x2: cx,
      y1: half ? cy : margin.top,
      y2: height - margin.bottom,
      stroke: color,
      ...(dash ? { "stroke-dasharray": dash } : {}),
      "stroke-opacity": opacity,
      "stroke-width": 1.5,
      "pointer-events": "none",
    }),
  );
  // Horizontal line: y1=y2=cy; from the left axis to the right (or the bubble, when "half").
  g.appendChild(
    svgEl("line", {
      "data-crosshair-line": "y",
      x1: margin.left,
      x2: half ? cx : width - margin.right,
      y1: cy,
      y2: cy,
      stroke: color,
      ...(dash ? { "stroke-dasharray": dash } : {}),
      "stroke-opacity": opacity,
      "stroke-width": 1.5,
      "pointer-events": "none",
    }),
  );

  if (showLabels) {
    g.appendChild(makeBadge("y", yLabel, color, cx, cy, r, margin, width, height, placement));
    g.appendChild(makeBadge("x", xLabel, color, cx, cy, r, margin, width, height, placement));
  }
}

/** Remove all crosshair children (hide without discarding the group). */
export function clearCrosshair(g: SVGGElement): void {
  while (g.firstChild) g.removeChild(g.firstChild);
}
