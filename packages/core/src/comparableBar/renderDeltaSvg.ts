// Imperative SVG renderer for the ComparableHorizontalBar row-level delta
// indicator: a small triangle glyph (up/down/flat) + formatted change label,
// drawn just right of each row's longer sub-bar. Presentational-only (see
// DeltaIndicatorConfig JSDoc, types.ts).
//
// Painted via the SVG scaffold layer UNCONDITIONALLY (regardless of the bar
// `renderer`), the same way this chart's title/axis text is always drawn on
// the SVG layer even in canvas/webgpu mode (see engine/comparableHorizontalBarChart.ts
// and webgpu/marks.ts: "Text/axes/titles stay on the SVG layer"). All three
// renderer modes therefore share the exact same geometry (ComparableDeltaModel,
// computed once in renderModel.ts) and the exact same paint path.
import { svgEl } from "../dom";
import type { ComparableBarModel } from "./renderModel";
import type { ComparableDeltaDirection } from "./delta";

const GLYPH_R = 5;
const LABEL_GAP = 4;

function glyphPath(direction: ComparableDeltaDirection, cx: number, cy: number): string {
  if (direction === "up") {
    return `M${cx},${cy - GLYPH_R} L${cx + GLYPH_R},${cy + GLYPH_R} L${cx - GLYPH_R},${cy + GLYPH_R} Z`;
  }
  if (direction === "down") {
    return `M${cx},${cy + GLYPH_R} L${cx + GLYPH_R},${cy - GLYPH_R} L${cx - GLYPH_R},${cy - GLYPH_R} Z`;
  }
  // flat: a short horizontal bar centred on the row.
  const half = GLYPH_R * 0.6;
  return `M${cx - GLYPH_R},${cy - half} L${cx + GLYPH_R},${cy - half} L${cx + GLYPH_R},${cy + half} L${cx - GLYPH_R},${cy + half} Z`;
}

export function renderComparableDeltaSvg(svg: SVGElement, bars: ComparableBarModel[]): void {
  for (const bar of bars) {
    const { delta } = bar;
    if (!delta) continue;
    const g = svgEl("g", {
      class: "mv-delta",
      "data-label": bar.label,
      "data-label-safe": bar.safe,
    });
    const cx = delta.x + GLYPH_R;
    const cy = delta.y;
    g.appendChild(
      svgEl("path", {
        class: `mv-delta-arrow mv-delta-arrow--${delta.direction}`,
        d: glyphPath(delta.direction, cx, cy),
        fill: delta.color,
      })
    );
    const text = svgEl("text", {
      class: "mv-delta-label",
      x: cx + GLYPH_R + LABEL_GAP,
      y: cy,
      fill: delta.color,
      "dominant-baseline": "middle",
    });
    text.textContent = delta.label;
    g.appendChild(text);
    svg.appendChild(g);
  }
}
