// Ported from michi-vz src/components/hooks/gapChart/useGapChartRenderer.ts.
// Renderer-agnostic geometry model shared by the SVG renderer, the canvas
// renderer, and the a11y/LLM context — the single source of truth GapChart
// already used in production.
import type { GapDataItem, Shape } from "../types";
import type { GapScales } from "./scales";
import type { GapColorResolver } from "./colors";

export interface GapElement {
  d: GapDataItem;
  i: number;
  y: number;
  barHeight: number;
  gapColor: string;
  value1Color: string;
  value2Color: string;
  x1: number;
  x2: number;
  barWidth: number;
  value1X: number;
  value2X: number;
  barOpacity: number;
  markerOpacity: number;
}

export interface GapRenderModel {
  elements: GapElement[];
  squares: GapElement[];
  nonSquares: GapElement[];
}

export function buildGapRenderModel(
  processedDataSet: GapDataItem[],
  scales: GapScales,
  colors: GapColorResolver,
  colorMode: "label" | "shape",
  highlightItems: string[],
  shapeValue1: Shape,
  shapeValue2: Shape
): GapRenderModel {
  const { xScale, yScale } = scales;
  const { getColor, getShapeColor } = colors;

  const elements: GapElement[] = processedDataSet.map((d, i) => {
    const y = yScale(d.label) || 0;
    const barHeight = yScale.bandwidth();

    const gapColor = colorMode === "shape" ? getShapeColor("gap", d.label) : getColor(d.label);
    const value1Color =
      colorMode === "shape" ? getShapeColor("value1", d.label) : getColor(d.label);
    const value2Color =
      colorMode === "shape" ? getShapeColor("value2", d.label) : getColor(d.label);

    const x1 = xScale(Math.min(d.value1, d.value2)) as number;
    const x2 = xScale(Math.max(d.value1, d.value2)) as number;
    const barWidth = x2 - x1;
    const value1X = xScale(d.value1) as number;
    const value2X = xScale(d.value2) as number;

    const isHighlighted = highlightItems.length === 0 || highlightItems.includes(d.label);
    const barOpacity = isHighlighted ? 0.7 : 0.3;
    const markerOpacity = isHighlighted ? 1 : 0.3;

    return {
      d,
      i,
      y,
      barHeight,
      gapColor,
      value1Color,
      value2Color,
      x1,
      x2,
      barWidth,
      value1X,
      value2X,
      barOpacity,
      markerOpacity,
    };
  });

  const squares: GapElement[] = [];
  const nonSquares: GapElement[] = [];
  const hasSquareValue1 = shapeValue1 === "square";
  const hasSquareValue2 = shapeValue2 === "square";
  for (const element of elements) {
    if (hasSquareValue1 || hasSquareValue2) squares.push(element);
    if (!hasSquareValue1 || !hasSquareValue2) nonSquares.push(element);
  }

  return { elements, squares, nonSquares };
}
