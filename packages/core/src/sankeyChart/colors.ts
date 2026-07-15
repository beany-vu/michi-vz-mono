// Per-node fill resolution for Sankey (colorsMapping > palette; transparent under
// skipColorMappingDispatch). Colour key = node id; links inherit their source or
// target node's colour. Mirrors the other charts' colour resolvers.
import { DEFAULT_COLORS } from "../theme/colors";

export interface SankeyColorResolver {
  getColor: (key: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildSankeyColors(
  nodeKeys: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false,
): SankeyColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;

  for (const key of nodeKeys) {
    if (generated[key]) continue;
    generated[key] = skipColorMappingDispatch ? "transparent" : palette[i % palette.length];
    i++;
  }

  const getColor = (key: string): string => generated[key] || palette[0];
  return { getColor, generatedColorsMapping: generated };
}
