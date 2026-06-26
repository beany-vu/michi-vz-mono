// Per-label colour resolution for ComparableHorizontalBar (colorsMapping >
// point.color > palette; transparent under skipColorMappingDispatch).
import { DEFAULT_COLORS } from "../theme/colors";
import type { ComparableBarDataPoint } from "../types";

export interface ComparableColorResolver {
  getColor: (label: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildComparableBarColors(
  points: ComparableBarDataPoint[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false
): ComparableColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;

  for (const d of points) {
    if (generated[d.label]) continue;
    generated[d.label] = skipColorMappingDispatch
      ? "transparent"
      : d.color ?? palette[i % palette.length];
    i++;
  }

  const getColor = (label: string): string => generated[label] || palette[0];
  return { getColor, generatedColorsMapping: generated };
}
