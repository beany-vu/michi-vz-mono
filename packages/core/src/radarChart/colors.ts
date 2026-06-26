// Per-label colour resolution for RadarChart.
import { DEFAULT_COLORS } from "../theme/colors";
import type { RadarDataItem } from "../types";

export interface RadarColorResolver {
  getColor: (label: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildRadarColors(
  items: RadarDataItem[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false
): RadarColorResolver {
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
