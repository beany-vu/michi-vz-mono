// Ported from michi-vz src/components/hooks/gapChart/useGapChartColors.ts.
import { DEFAULT_COLORS } from "../theme/colors";
import type { ShapeMapping } from "../types";

export interface GapColorResolver {
  getColor: (label: string) => string;
  getShapeColor: (type: "value1" | "value2" | "gap", label?: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildGapColors(
  labels: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  colorMode: "label" | "shape" = "label",
  shapeColorsMapping?: ShapeMapping,
  skipColorMappingDispatch = false
): GapColorResolver {
  const colorPalette = colors.length > 0 ? colors : DEFAULT_COLORS;

  // Generate colours for all labels upfront, caching by insertion order.
  const generatedColorsMapping: Record<string, string> = { ...colorsMapping };
  let colorIndex = Object.keys(colorsMapping || {}).length;
  for (const label of labels) {
    if (!generatedColorsMapping[label]) {
      generatedColorsMapping[label] = skipColorMappingDispatch
        ? "transparent"
        : colorPalette[colorIndex % colorPalette.length];
      colorIndex++;
    }
  }

  const getColor = (label: string): string => {
    if (colorMode === "shape" && shapeColorsMapping) {
      return shapeColorsMapping.gap || colorPalette[0];
    }
    return generatedColorsMapping[label] || colorPalette[0];
  };

  const getShapeColor = (type: "value1" | "value2" | "gap", label?: string): string => {
    if (colorMode === "shape") {
      if (shapeColorsMapping && shapeColorsMapping[type]) {
        return shapeColorsMapping[type] as string;
      }
      switch (type) {
        case "value1":
          return colorPalette[0];
        case "value2":
          return colorPalette[1] || colorPalette[0];
        case "gap":
          return colorPalette[2] || colorPalette[0];
        default:
          return colorPalette[0];
      }
    }
    if (label) return generatedColorsMapping[label] || colorPalette[0];
    return colorPalette[0];
  };

  return { getColor, getShapeColor, generatedColorsMapping };
}
