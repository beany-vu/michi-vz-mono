// Imperative SVG mark renderer - port of GapChart.tsx's `renderGapBars` JSX.
// Emits the same node structure + classes + data-label/data-label-safe attrs so
// the consumer colour contract (`.gap-bar[data-label-safe="X"] { fill }`) and
// the canvas colour probe keep working identically.
import { svgEl, htmlEl } from "../dom";
import { sanitizeForClassName } from "../math/sanitize";
import { getShapePath, getSquareDimensions } from "./shapes";
import type { GapDataItem, Margin, Shape, ShapeMapping } from "../types";
import type { GapRenderModel, GapElement } from "./renderModel";

export interface GapSvgOptions {
  shapeValue1: Shape;
  shapeValue2: Shape;
  squareRadius: number;
  enableTransitions: boolean;
}

export interface GapInteractions {
  onEnter: (d: GapDataItem, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (d: GapDataItem, ev: MouseEvent) => void;
}

function wire(node: SVGElement, d: GapDataItem, ia: GapInteractions): void {
  node.style.cursor = "pointer";
  node.addEventListener("mouseenter", (e) => ia.onEnter(d, e));
  node.addEventListener("mouseleave", (e) => ia.onLeave(e));
  node.addEventListener("click", (e) => ia.onClick(d, e));
}

function marker(
  el: GapElement,
  shape: Shape,
  x: number,
  color: string,
  squareRadius: number,
  cls: string,
): SVGElement {
  const { d, y, barHeight, markerOpacity } = el;
  const center = y + barHeight / 2;
  const safe = sanitizeForClassName(d.label);
  if (shape === "square") {
    const dims = getSquareDimensions();
    return svgEl("rect", {
      class: `gap-marker ${cls}`,
      "data-label": d.label,
      "data-label-safe": safe,
      x: x + dims.x,
      y: center + dims.y,
      width: dims.width,
      height: dims.height,
      fill: color,
      opacity: markerOpacity,
      rx: squareRadius,
      ry: squareRadius,
    });
  }
  return svgEl("path", {
    class: `gap-marker ${cls}`,
    "data-label": d.label,
    "data-label-safe": safe,
    d: getShapePath(shape) || "",
    transform: `translate(${x}, ${center})`,
    fill: color,
    opacity: markerOpacity,
  });
}

export function renderGapSvg(
  parent: SVGElement,
  model: GapRenderModel,
  o: GapSvgOptions,
  ia: GapInteractions,
): void {
  const root = svgEl("g", { class: "gap-chart-content" });
  const transition = o.enableTransitions ? "all 0.1s ease-in-out" : "none";

  // Layer 1 - gap bars + connecting lines
  for (const el of model.elements) {
    const { d, y, barHeight, gapColor, x1, x2, barWidth, barOpacity, markerOpacity } = el;
    const center = y + barHeight / 2;
    const safe = sanitizeForClassName(d.label);

    const bar = svgEl("rect", {
      class: "gap-bar",
      "data-label": d.label,
      "data-label-safe": safe,
      x: x1,
      y: center - 4,
      width: barWidth,
      height: 8,
      fill: gapColor,
      opacity: barOpacity,
      rx: 4,
      ry: 4,
    });
    bar.style.transition = transition;
    wire(bar, d, ia);
    root.appendChild(bar);

    const diff = d.difference ?? d.value1 - d.value2;
    const line = svgEl("line", {
      class: "gap-line",
      "data-label": d.label,
      "data-label-safe": safe,
      x1,
      y1: center,
      x2,
      y2: center,
      stroke: "white",
      "stroke-dasharray": diff < 0 ? "4,2" : "0",
      opacity: markerOpacity,
    });
    line.style.transition = transition;
    root.appendChild(line);
  }

  // Layer 2 - value markers
  for (const el of model.elements) {
    const { d, value1X, value2X, value1Color, value2Color } = el;
    const m1 = marker(el, o.shapeValue1, value1X, value1Color, o.squareRadius, "value1-marker");
    m1.style.transition = transition;
    wire(m1, d, ia);
    root.appendChild(m1);

    const m2 = marker(el, o.shapeValue2, value2X, value2Color, o.squareRadius, "value2-marker");
    m2.style.transition = transition;
    wire(m2, d, ia);
    root.appendChild(m2);
  }

  parent.appendChild(root);
}

// ----- Built-in legend (port of GapChart.tsx's `showLegend` block + useGapChartLegend) -----

export interface GapLegendItem {
  type: "value1" | "value2" | "gap";
  label: string;
  color: string;
  shape?: Shape;
}

/**
 * Mirror of legacy `useGapChartLegend`: build up to three legend items - value1, gap,
 * value2 (in that order) - from `shapesLabelsMapping`. A role is skipped when its label
 * is falsy. Colours come from `shapeColorsMapping` when `colorMode === "shape"`, else the
 * legacy defaults (#666 for the value markers, #999 for the gap bar).
 */
export function buildGapLegendItems(
  shapesLabelsMapping: ShapeMapping | undefined,
  shapeValue1: Shape,
  shapeValue2: Shape,
  colorMode: "label" | "shape",
  shapeColorsMapping?: ShapeMapping,
): GapLegendItem[] {
  if (!shapesLabelsMapping) return [];
  const items: GapLegendItem[] = [];
  if (shapesLabelsMapping.value1) {
    items.push({
      type: "value1",
      label: shapesLabelsMapping.value1,
      shape: shapeValue1,
      color:
        colorMode === "shape" && shapeColorsMapping?.value1 ? shapeColorsMapping.value1 : "#666",
    });
  }
  if (shapesLabelsMapping.gap) {
    items.push({
      type: "gap",
      label: shapesLabelsMapping.gap,
      color: colorMode === "shape" && shapeColorsMapping?.gap ? shapeColorsMapping.gap : "#999",
    });
  }
  if (shapesLabelsMapping.value2) {
    items.push({
      type: "value2",
      label: shapesLabelsMapping.value2,
      shape: shapeValue2,
      color:
        colorMode === "shape" && shapeColorsMapping?.value2 ? shapeColorsMapping.value2 : "#666",
    });
  }
  return items;
}

export interface GapLegendLayout {
  width: number;
  height: number;
  margin: Margin;
  legendAlign: "left" | "center" | "right";
}

const LEGEND_ITEM_WIDTH = 180;
const LEGEND_ITEM_SPACING = 40;
const LEGEND_SHAPE_OFFSET = 15;

function legendLabel(text: string, color: string, x: number, foWidth: number): SVGElement {
  const fo = svgEl("foreignObject", { x, y: -10, width: foWidth, height: 20 });
  const div = htmlEl("div", { title: text });
  div.textContent = text;
  Object.assign(div.style, {
    fontSize: "12px",
    color: color || "#666",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    paddingLeft: "5px",
  });
  fo.appendChild(div);
  return fo;
}

/**
 * Render the bottom-aligned shape legend. Renders in both SVG and canvas modes (it lives
 * on the SVG layer above the canvas, like the axes). The caller gates on `showLegend &&
 * shapesLabelsMapping`; an empty item list is a no-op.
 */
export function renderGapLegend(
  parent: SVGElement,
  items: GapLegendItem[],
  layout: GapLegendLayout,
): void {
  if (items.length === 0) return;
  const { width, height, margin, legendAlign } = layout;

  const groupX =
    legendAlign === "left"
      ? margin.left
      : legendAlign === "right"
        ? width - margin.right
        : width / 2;
  const groupY = height - margin.bottom / 2 + 20;
  const g = svgEl("g", { class: "gap-legend", transform: `translate(${groupX}, ${groupY})` });

  const totalWidth = items.length * LEGEND_ITEM_WIDTH + (items.length - 1) * LEGEND_ITEM_SPACING;
  let currentX =
    legendAlign === "left" ? 0 : legendAlign === "right" ? -totalWidth : -totalWidth / 2;

  for (const item of items) {
    const itemG = svgEl("g", { transform: `translate(${currentX}, 0)` });
    if (item.type === "gap") {
      itemG.appendChild(
        svgEl("rect", {
          x: -10,
          y: -5,
          width: 20,
          height: 10,
          fill: item.color || "#999",
          opacity: 0.7,
          rx: 2,
          ry: 2,
        }),
      );
      itemG.appendChild(
        legendLabel(
          item.label,
          item.color,
          LEGEND_SHAPE_OFFSET + 5,
          LEGEND_ITEM_WIDTH - LEGEND_SHAPE_OFFSET - 10,
        ),
      );
    } else {
      const shape = item.shape || "circle";
      if (shape === "square") {
        const dims = getSquareDimensions(12);
        itemG.appendChild(
          svgEl("rect", {
            x: dims.x,
            y: dims.y,
            width: dims.width,
            height: dims.height,
            fill: item.color || "#666",
            rx: 2,
            ry: 2,
          }),
        );
      } else {
        itemG.appendChild(
          svgEl("path", { d: getShapePath(shape, 12) || "", fill: item.color || "#666" }),
        );
      }
      itemG.appendChild(
        legendLabel(
          item.label,
          item.color,
          LEGEND_SHAPE_OFFSET,
          LEGEND_ITEM_WIDTH - LEGEND_SHAPE_OFFSET - 5,
        ),
      );
    }
    g.appendChild(itemG);
    currentX += LEGEND_ITEM_WIDTH + LEGEND_ITEM_SPACING;
  }
  parent.appendChild(g);
}
