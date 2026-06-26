// Per-key colour resolution for RibbonChart.
import { DEFAULT_COLORS } from "../theme/colors";

export interface RibbonColorResolver {
  getColor: (key: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildRibbonColors(
  keys: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false
): RibbonColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;
  for (const key of keys) {
    if (generated[key]) continue;
    generated[key] = skipColorMappingDispatch ? "transparent" : palette[i % palette.length];
    i++;
  }
  return { getColor: (k) => generated[k] || palette[0], generatedColorsMapping: generated };
}
