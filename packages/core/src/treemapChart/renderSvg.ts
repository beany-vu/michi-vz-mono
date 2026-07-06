// Imperative SVG renderer for Treemap. Each leaf is one <rect class="tile"> (data-
// label + data-label-safe for the colour contract); when split is on, a lighter
// remainder rect covers the full tile and a solid primary rect covers the left
// `realizedWidth`. Parent containers get a header label. Highlight dimming
// (opacity) is computed here, not baked into the model.
import { svgEl } from "../dom";
import { readableTextColor } from "../math/contrast";
import type { TreemapLeafMark, TreemapRenderModel } from "./renderModel";

export interface TreemapSvgOptions {
  enableTransitions: boolean;
}

export interface TreemapInteractions {
  onEnter: (leaf: TreemapLeafMark, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (leaf: TreemapLeafMark, ev: MouseEvent) => void;
}

function fitText(text: string, w: number, charPx = 6.2): string {
  const max = Math.floor((w - 8) / charPx);
  if (max <= 0) return "";
  if (text.length <= max) return text;
  if (max <= 1) return "";
  return text.slice(0, max - 1) + "…";
}

export function renderTreemapSvg(
  parent: SVGElement,
  model: TreemapRenderModel,
  o: TreemapSvgOptions,
  ia: TreemapInteractions
): void {
  const root = svgEl("g", { class: "treemap-chart-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";
  const anyHighlight = model.highlightSet.size > 0;

  // Untapped = solid colour + a translucent WHITE veil (backdrop-independent, so
  // it reads as a lighter tint on both light and dark themes). veil = 1 - splitOpacity.
  const veil = Math.max(0, Math.min(0.95, 1 - model.splitOpacity));

  // Parent containers first (so leaves paint on top of the header strip).
  for (const c of model.containers) {
    const box = svgEl("rect", {
      class: "tile-group",
      "data-label-safe": c.dataLabelSafe,
      x: c.x,
      y: c.y,
      width: c.w,
      height: c.h,
      fill: "none",
      stroke: "var(--michi-vz-grid, #d9d9d9)",
      "stroke-width": 1,
    });
    root.appendChild(box);
    if (c.w > 28 && model.paddingTop >= 12) {
      const label = svgEl("text", {
        class: "tile-group-label",
        x: c.x + 4,
        y: c.y + model.paddingTop - 5,
        fill: "var(--michi-vz-ink, currentColor)",
      });
      label.textContent = fitText(c.label, c.w);
      root.appendChild(label);
    }
  }

  for (const d of model.leaves) {
    const highlighted =
      !anyHighlight || model.highlightSet.has(d.label) || model.highlightSet.has(d.colorKey);
    const groupOpacity = highlighted ? 1 : 0.2;

    // Whole-cell opacity carries highlight dimming; inner rects stay at full alpha.
    const g = svgEl("g", { class: "tile-cell", opacity: groupOpacity });

    const base = svgEl("rect", {
      class: "tile",
      "data-label": d.colorKey,
      "data-label-safe": d.dataLabelSafe,
      "data-leaf": d.label,
      "data-leaf-safe": d.leafSafe,
      x: d.x,
      y: d.y,
      width: d.w,
      height: d.h,
      fill: d.fill,
      rx: 1,
      ry: 1,
    });
    g.appendChild(base);

    if (model.showSplit && d.partialPct != null && d.realizedWidth < d.w) {
      const veilRect = svgEl("rect", {
        class: "tile-veil",
        "data-leaf": d.label,
        x: d.x + d.realizedWidth,
        y: d.y,
        width: d.w - d.realizedWidth,
        height: d.h,
        fill: "#ffffff",
        opacity: veil,
        rx: 1,
        ry: 1,
      });
      g.appendChild(veilRect);
    }

    // Adaptive label: name (+ percent when split and the tile is big enough).
    // Text colour auto-contrasts against the tile fill (readable on light or dark tiles).
    // The label sits over the solid (realized) part, so contrast vs d.fill is correct.
    const ink = readableTextColor(d.fill);
    if (d.h >= 24 && d.w >= 30) {
      const name = svgEl("text", {
        class: "tile-label",
        x: d.x + 4,
        y: d.y + 14,
        fill: ink,
      });
      name.textContent = fitText(d.code ? `${d.code}` : d.label, d.w);
      g.appendChild(name);
      // Second-line gate: reused verbatim (not reinvented) from the split
      // percent line below - two text lines need more room than the name
      // alone (see TreemapChartProps["tileValueLabels"] JSDoc in types.ts).
      const fitsSecondLine = d.w >= 48 && d.h >= 34;
      let secondLineY = d.y + 30;
      if (model.showSplit && d.partialPct != null && fitsSecondLine) {
        const pct = svgEl("text", {
          class: "tile-pct",
          x: d.x + 4,
          y: secondLineY,
          fill: ink,
        });
        pct.textContent = `${Math.round(d.partialPct * 100)}%`;
        g.appendChild(pct);
        secondLineY += 16; // stack the value label below an already-shown split pct
      }
      if (model.tileValueLabelFormatter && fitsSecondLine) {
        const fraction = model.grandTotal > 0 ? d.value / model.grandTotal : 0;
        const valueLabel = svgEl("text", {
          class: "tile-value-label",
          x: d.x + 4,
          y: secondLineY,
          fill: ink,
        });
        valueLabel.textContent = fitText(model.tileValueLabelFormatter(d.value, fraction, d), d.w);
        g.appendChild(valueLabel);
      }
    }

    g.style.cursor = "pointer";
    g.style.transition = transition; // animate the cell's highlight opacity
    g.addEventListener("mouseenter", (e) => ia.onEnter(d, e));
    g.addEventListener("mouseleave", (e) => ia.onLeave(e));
    g.addEventListener("click", (e) => ia.onClick(d, e));
    root.appendChild(g);
  }

  parent.appendChild(root);
}
