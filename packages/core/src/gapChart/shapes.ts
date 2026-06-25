// Ported from michi-vz src/components/hooks/gapChart/useGapChartShapes.ts.
import { symbol, symbolCircle, symbolTriangle } from "d3-shape";
import type { Shape } from "../types";

export function getShapePath(shape: Shape | string, size = 14): string | null {
  switch (shape) {
    case "circle":
      return symbol().type(symbolCircle).size(size * 0.8 * (size * 0.8))();
    case "square":
      // squares are drawn as <rect>, not a path
      return null;
    case "triangle":
      return symbol().type(symbolTriangle).size(size * size)();
    default:
      return symbol().type(symbolCircle).size(size * 0.8 * (size * 0.8))();
  }
}

export function getSquareDimensions(size = 14): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const half = size / 2;
  return { x: -half, y: -half, width: size, height: size };
}
