// Imperative SVG renderer for ScatterChart `pointLabels`.
//
// Painted on the SVG scaffold layer UNCONDITIONALLY (regardless of the
// point-cloud `renderer`) - the exact same treatment as ComparableBar's delta
// indicator (see comparableBar/renderDeltaSvg.ts) and this chart's own
// title/axes (see engine/scatterChart.ts: "Text and axes stay on the SVG
// layer" in scatterChart/renderWebgpu.ts). All three renderer modes
// (svg/canvas/webgpu) therefore show identical labels, computed once from the
// same ScatterPointLabelMark[] (pointLabels.ts).
import { svgEl } from "../dom";
import type { ScatterPointLabelMark } from "./pointLabels";

export function renderScatterPointLabelsSvg(svg: SVGElement, marks: ScatterPointLabelMark[]): void {
  for (const m of marks) {
    const g = svgEl("g", {
      class: "mv-point-label",
      "data-label": m.point.label,
      "data-label-safe": m.point.safe,
    });
    const text = svgEl("text", {
      class: "mv-point-label-text",
      x: m.x,
      y: m.y,
      "dominant-baseline": "middle",
      fill: "var(--michi-vz-ink, currentColor)",
    });
    text.textContent = m.text;
    g.appendChild(text);
    svg.appendChild(g);
  }
}
