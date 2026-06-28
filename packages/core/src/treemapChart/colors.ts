// Per-group fill resolution for Treemap (colorsMapping > palette; transparent
// under skipColorMappingDispatch). Colour key = top-level ancestor in nested mode,
// the leaf label in flat mode. Mirrors the other charts' colour resolvers.
import { DEFAULT_COLORS } from "../theme/colors";

export interface TreemapColorResolver {
  getColor: (key: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildTreemapColors(
  groupKeys: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false
): TreemapColorResolver {
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
