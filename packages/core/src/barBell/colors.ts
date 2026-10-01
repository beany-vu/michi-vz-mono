// Per-key colour resolution for BarBell (colorsMapping > palette; transparent
// under skipColorMappingDispatch).
import { defaultPalette } from "../theme/colors";

export interface BarBellColorResolver {
  getColor: (key: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildBarBellColors(
  keys: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false,
): BarBellColorResolver {
  const palette = colors.length > 0 ? colors : defaultPalette();
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;
  for (const key of keys) {
    if (generated[key]) continue;
    generated[key] = skipColorMappingDispatch ? "transparent" : palette[i % palette.length];
    i++;
  }
  return { getColor: (k) => generated[k] || palette[0], generatedColorsMapping: generated };
}
