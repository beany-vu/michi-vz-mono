// Colour resolution for FountainChart (audit fountain #9).
// - Built from the UNFILTERED dataSet in first-seen label order, so disabling a label
//   never moves the others to a new palette slot (the caller passes props.dataSet,
//   not the drawn jets).
// - Per label (legend, generatedColorsMapping): colorsMapping[label] ?? the first
//   item colour seen for the label ?? the next palette slot.
// - Per jet: colorsMapping[label] ?? item.color ?? the label's colour, so one gold
//   year in a series keeps its own colour.
// Under skipColorMappingDispatch an unmapped label resolves to "transparent" (the
// consumer's CSS colours it through data-label-safe); explicit colours still apply.
import { DEFAULT_COLORS } from "../theme/colors";
import type { FountainDataItem } from "../types";

export interface FountainColorResolver {
  /** The label's colour (legend swatch, trend line of a series) */
  getColor: (label: string) => string;
  /** One jet's colour: colorsMapping[label] ?? item.color ?? the label's colour */
  colorOf: (item: FountainDataItem) => string;
  /** label -> colour for every label of the dataSet (disabled ones included) */
  generatedColorsMapping: Record<string, string>;
}

export function buildFountainColors(
  dataSet: FountainDataItem[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false,
): FountainColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const mapping = colorsMapping ?? {};
  const generated: Record<string, string> = { ...mapping };
  let slot = Object.keys(mapping).length;
  for (const item of dataSet ?? []) {
    if (!item) continue;
    const label = item.label;
    if (generated[label]) continue;
    if (item.color) {
      generated[label] = item.color;
      continue;
    }
    generated[label] = skipColorMappingDispatch ? "transparent" : palette[slot % palette.length];
    slot++;
  }
  const getColor = (label: string): string => generated[label] || palette[0];
  const colorOf = (item: FountainDataItem): string =>
    mapping[item.label] || item.color || getColor(item.label);
  return { getColor, colorOf, generatedColorsMapping: generated };
}
