// Per-bubble fill resolution (colorsMapping > palette; transparent under
// skipColorMappingDispatch). Colour key = bubble label. Mirrors the other charts'
// colour resolvers so the data-label-safe contract stays uniform.
import { DEFAULT_COLORS } from "../theme/colors";

export interface BubbleColorResolver {
  getColor: (key: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildBubbleColors(
  groupKeys: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false,
): BubbleColorResolver {
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
