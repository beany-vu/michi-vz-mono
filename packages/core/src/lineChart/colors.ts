// Per-label colour resolution for LineChart. Precedence:
//   colorsMapping[label]  (explicit override)
//   > item.color          (the series' own colour)
//   > palette[index]       (auto-assigned, stable by insertion order)
// Under skipColorMappingDispatch, unmapped labels resolve to "transparent" so the
// consumer's CSS drives mark colour (the external-CSS contract) — matching gap.
import { DEFAULT_COLORS } from "../theme/colors";
import type { LineDataItem } from "../types";

export interface LineColorResolver {
  getColor: (label: string) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildLineColors(
  dataSet: LineDataItem[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false
): LineColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;

  for (const item of dataSet) {
    if (generated[item.label]) continue; // colorsMapping override wins
    generated[item.label] = skipColorMappingDispatch
      ? "transparent"
      : item.color ?? palette[i % palette.length];
    i++;
  }

  const getColor = (label: string): string => generated[label] || palette[0];
  return { getColor, generatedColorsMapping: generated };
}
