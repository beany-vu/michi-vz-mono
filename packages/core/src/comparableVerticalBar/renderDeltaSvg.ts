// Imperative SVG renderer for the ComparableVerticalBar row-level delta
// indicator: a small triangle glyph (up/down/flat) + formatted change label,
// drawn ABOVE each column pair (legacy `translate(bandwidth/3, -32)` /
// `LabelValue y={25}` placement - see comparableVerticalBar/delta.ts). The
// glyph sits at the anchor; the label sits BELOW it (vertical stack), unlike
// the horizontal chart's glyph-then-label-to-the-right layout.
//
// Painted via the SVG scaffold layer UNCONDITIONALLY (regardless of the bar
// `renderer`), the same treatment as this chart's title/axis text (see
// engine/comparableVerticalBarChart.ts). All three renderer modes therefore
// share the exact same geometry (ComparableVerticalDeltaModel, computed once in
// renderModel.ts) and the exact same paint path.
import { svgEl } from "../dom";
import type { ComparableVerticalBarModel } from "./renderModel";
import type { ComparableDeltaDirection } from "./delta";

const GLYPH_R = 5;

function glyphPath(direction: ComparableDeltaDirection, cx: number, cy: number): string {
  if (direction === "up") {
    return `M${cx},${cy - GLYPH_R} L${cx + GLYPH_R},${cy + GLYPH_R} L${cx - GLYPH_R},${cy + GLYPH_R} Z`;
  }
  if (direction === "down") {
    return `M${cx},${cy + GLYPH_R} L${cx + GLYPH_R},${cy - GLYPH_R} L${cx - GLYPH_R},${cy - GLYPH_R} Z`;
  }
  // flat: a short horizontal bar centred on the anchor.
  const half = GLYPH_R * 0.6;
  return `M${cx - GLYPH_R},${cy - half} L${cx + GLYPH_R},${cy - half} L${cx + GLYPH_R},${cy + half} L${cx - GLYPH_R},${cy + half} Z`;
}

export function renderComparableVerticalDeltaSvg(
  svg: SVGElement,
  bars: ComparableVerticalBarModel[],
): void {
  for (const bar of bars) {
    const { delta } = bar;
    if (!delta) continue;
    const g = svgEl("g", {
      class: "mv-delta",
      "data-label": bar.label,
      "data-label-safe": bar.safe,
    });
    g.appendChild(
      svgEl("path", {
        class: `mv-delta-arrow mv-delta-arrow--${delta.direction}`,
        d: glyphPath(delta.direction, delta.x, delta.y),
        fill: delta.color,
      }),
    );
    const text = svgEl("text", {
      class: "mv-delta-label",
      x: delta.labelX,
      y: delta.labelY,
      fill: delta.color,
      "text-anchor": "middle",
    });
    text.textContent = delta.label;
    g.appendChild(text);
    svg.appendChild(g);
  }
}
