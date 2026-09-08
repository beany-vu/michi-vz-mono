// Per-symbol fill resolution (colorsMapping > per-item explicit colour > palette;
// transparent under skipColorMappingDispatch). Colour key = the symbol's label -
// same convention as BubbleChart's colour resolver (buildBubbleColors), the
// closest existing pattern for a "consumer passes colors" force-simulated circle
// chart (the legacy MapSymbolForce keyed colour off a bespoke `colorValueKey`
// field + a bundled region palette; this chart uses the house's standard
// label/colorsMapping/colors contract instead).
import { scaleThreshold } from "d3-scale";
import { DEFAULT_COLORS } from "../theme/colors";
import type { SymbolMapNode } from "./data";

export interface SymbolMapColorResolver {
  /** Per-label colour (legend contract). */
  getColor: (key: string) => string;
  /** Per-node colour with the full precedence: colorsMapping[label] >
   * colorScale(value) (only when the node has a value) > item colour > palette.
   * Returns "" for a no-value node without a mapping/explicit colour - the
   * render model paints `noDataColor` in that case. */
  getColorFor: (node: SymbolMapNode) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildSymbolMapColors(
  groupKeys: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  skipColorMappingDispatch = false,
  colorScaleConfig?: { domain: number[]; range: string[] },
): SymbolMapColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping || {}).length;

  for (const key of groupKeys) {
    if (generated[key]) continue;
    generated[key] = skipColorMappingDispatch ? "transparent" : palette[i % palette.length];
    i++;
  }

  // Value-driven threshold scale (same contract as ChoroplethMap's colorScale):
  // values outside the domain clamp to the first/last range colour.
  const threshold =
    colorScaleConfig && colorScaleConfig.domain.length > 0 && colorScaleConfig.range.length > 0
      ? scaleThreshold<number, string>()
          .domain(colorScaleConfig.domain)
          .range(colorScaleConfig.range)
      : undefined;

  const getColor = (key: string): string => generated[key] || palette[0];
  const getColorFor = (node: SymbolMapNode): string => {
    if (skipColorMappingDispatch) return "transparent";
    if (colorsMapping?.[node.label]) return colorsMapping[node.label];
    if (threshold && node.hasValue) return threshold(node.value);
    if (node.color) return node.color;
    return node.hasValue ? getColor(node.label) : "";
  };
  return { getColor, getColorFor, generatedColorsMapping: generated };
}
