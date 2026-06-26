// Per-label colour resolution for DualHorizontalBar (colorsMapping > point.color >
// palette; transparent under skipColorMappingDispatch).
import { DEFAULT_COLORS } from "../theme/colors";
import type { DualBarDataPoint } from "../types";

export interface DualColorResolver {
  getColor: (label: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildDualBarColors(
  points: DualBarDataPoint[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false
): DualColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;
  for (const d of points) {
    if (generated[d.label]) continue;
    generated[d.label] = skipColorMappingDispatch ? "transparent" : d.color ?? palette[i % palette.length];
    i++;
  }
  return { getColor: (l) => generated[l] || palette[0], generatedColorsMapping: generated };
}
