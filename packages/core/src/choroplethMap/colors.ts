// Per-region colour resolution for ChoroplethMap. Precedence (highest first):
// colorsMapping[label] (categorical, e.g. the sdg-trade Data Availability
// "latest year available" buckets) > colorScale(value) (continuous scaleThreshold,
// values outside the domain clamp to the first/last range colour - d3's own
// scaleThreshold behaviour) > row.color (explicit per-item override) > the
// generated categorical palette. Unmatched features (no joined row at all) are
// NOT handled here - see renderModel.ts, which falls back to `noDataColor`.
import { scaleThreshold } from "d3-scale";
import { DEFAULT_COLORS } from "../theme/colors";
import type { ChoroplethDataItem } from "../types";

export interface ChoroplethColorResolver {
  getColor: (d: ChoroplethDataItem) => string;
  generatedColorsMapping: Record<string, string>;
}

export function buildChoroplethColors(
  dataSet: ChoroplethDataItem[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  colorScaleConfig?: { domain: number[]; range: string[] },
  skipColorMappingDispatch = false
): ChoroplethColorResolver {
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const threshold =
    colorScaleConfig && colorScaleConfig.domain.length > 0 && colorScaleConfig.range.length > 0
      ? scaleThreshold<number, string>().domain(colorScaleConfig.domain).range(colorScaleConfig.range)
      : undefined;

  const resolveForRow = (d: ChoroplethDataItem): string => {
    if (colorsMapping?.[d.label]) return colorsMapping[d.label];
    if (threshold && typeof d.value === "number" && Number.isFinite(d.value)) return threshold(d.value);
    return d.color ?? "";
  };

  const generated: Record<string, string> = { ...colorsMapping };
  let i = Object.keys(colorsMapping ?? {}).length;
  for (const d of dataSet ?? []) {
    if (generated[d.label]) continue;
    if (skipColorMappingDispatch) {
      generated[d.label] = "transparent";
    } else {
      generated[d.label] = resolveForRow(d) || palette[i % palette.length];
    }
    i++;
  }

  const getColor = (d: ChoroplethDataItem): string => {
    if (skipColorMappingDispatch) return "transparent";
    return resolveForRow(d) || generated[d.label] || palette[0];
  };

  return { getColor, generatedColorsMapping: generated };
}
