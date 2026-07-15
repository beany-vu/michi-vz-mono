// Per-label colour resolution for RadarChart.
import { DEFAULT_COLORS } from "../theme/colors";
import type { RadarDataItem } from "../types";

export interface RadarColorResolver {
  getColor: (label: string) => string;
  generatedColorsMapping: Record<string, string>;
}

/** Strip a trailing `-YYYY` year suffix so a series labelled "China-2024" resolves
 *  the base colour keyed "China" (the legend/colorsMapping authority keys by member). */
const baseLabel = (l: string): string => l.replace(/-\d{4}$/, "");

export function buildRadarColors(
  items: RadarDataItem[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false,
): RadarColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;
  for (const it of items) {
    // Already coloured under the full label OR its year-stripped base → skip.
    if (generated[it.label] || generated[baseLabel(it.label)]) continue;
    generated[it.label] = skipColorMappingDispatch
      ? "transparent"
      : (it.color ?? palette[i % palette.length]);
    i++;
  }
  return {
    getColor: (l) => generated[l] || generated[baseLabel(l)] || palette[0],
    generatedColorsMapping: generated,
  };
}
