// Per-symbol fill resolution (colorsMapping > per-item explicit colour > palette;
// transparent under skipColorMappingDispatch). Colour key = the symbol's label -
// same convention as BubbleChart's colour resolver (buildBubbleColors), the
// closest existing pattern for a "consumer passes colors" force-simulated circle
// chart (the legacy MapSymbolForce keyed colour off a bespoke `colorValueKey`
// field + a bundled region palette; this chart uses the house's standard
// label/colorsMapping/colors contract instead).
import { DEFAULT_COLORS } from "../theme/colors";

export interface SymbolMapColorResolver {
  getColor: (key: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildSymbolMapColors(
  groupKeys: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false,
): SymbolMapColorResolver {
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
