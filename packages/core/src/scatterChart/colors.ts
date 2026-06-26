// Per-label colour resolution for ScatterPlot (colorsMapping > point.color >
// palette; transparent under skipColorMappingDispatch).
import { DEFAULT_COLORS } from "../theme/colors";
import type { ScatterDataPoint } from "../types";

export interface ScatterColorResolver {
  getColor: (label: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildScatterColors(
  points: ScatterDataPoint[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false
): ScatterColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;

  for (const p of points) {
    if (generated[p.label]) continue;
    generated[p.label] = skipColorMappingDispatch
      ? "transparent"
      : p.color ?? palette[i % palette.length];
    i++;
  }

  const getColor = (label: string): string => generated[label] || palette[0];
  return { getColor, generatedColorsMapping: generated };
}
