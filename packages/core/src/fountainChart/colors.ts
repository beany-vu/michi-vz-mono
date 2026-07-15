// Per-label colour resolution for FountainChart. Precedence matches the other
// charts: colorsMapping (explicit) > item.color > generated palette. One hue per
// label, so jets that share a label (a series across time) share a colour.
import { DEFAULT_COLORS } from "../theme/colors";
import type { FountainDataItem } from "../types";

export interface FountainColorResolver {
  getColor: (label: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildFountainColors(
  items: FountainDataItem[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false,
): FountainColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;
  for (const item of items) {
    const label = item.label;
    if (generated[label]) continue;
    if (item.color) {
      generated[label] = item.color;
      continue;
    }
    generated[label] = skipColorMappingDispatch ? "transparent" : palette[i % palette.length];
    i++;
  }
  return { getColor: (l) => generated[l] || palette[0], generatedColorsMapping: generated };
}
