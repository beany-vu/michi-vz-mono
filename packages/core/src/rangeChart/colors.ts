// Per-label colour resolution for RangeChart (colorsMapping > item.color >
// palette; transparent under skipColorMappingDispatch).
import { DEFAULT_COLORS } from "../theme/colors";
import type { RangeDataItem } from "../types";

export interface RangeColorResolver {
  getColor: (label: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildRangeColors(
  items: RangeDataItem[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false
): RangeColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;
  for (const it of items) {
    if (generated[it.label]) continue;
    generated[it.label] = skipColorMappingDispatch ? "transparent" : it.color ?? palette[i % palette.length];
    i++;
  }
  return { getColor: (l) => generated[l] || palette[0], generatedColorsMapping: generated };
}
