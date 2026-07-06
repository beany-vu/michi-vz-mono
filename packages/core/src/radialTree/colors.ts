// Per-group fill resolution for RadialTree (colorsMapping > palette; transparent
// under skipColorMappingDispatch). Colour key = top-level ancestor label, exactly
// like TreemapChart's colour resolver (a leaf shares its group's colour, ported
// from the legacy TreeRadial's `colorValueKey`, which the same-named legacy
// groupBy copied from the group onto itself, not the leaf).
import { DEFAULT_COLORS } from "../theme/colors";

export interface RadialTreeColorResolver {
  getColor: (key: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildRadialTreeColors(
  groupKeys: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false
): RadialTreeColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;

  for (const key of groupKeys) {
    if (generated[key]) continue;
    generated[key] = skipColorMappingDispatch ? "transparent" : palette[i % palette.length];
    i++;
  }

  const getColor = (key: string): string => generated[key] || palette[0];
  return { getColor, generatedColorsMapping: generated };
}
