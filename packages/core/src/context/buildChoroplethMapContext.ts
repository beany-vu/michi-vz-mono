// Renderer-agnostic semantic context for ChoroplethMap: stats over the JOINED
// values (not the raw geography feature count baked in twice), an NL summary,
// and an a11yTable listing every region + its value (doubles as the vision-free
// alt text / screen-reader mirror, same convention as every other chart).
import { buildLegendData } from "./legend";
import type { ChoroplethMapChartContext, ChoroplethRegionContext, ChoroplethDataItem } from "../types";
import type { NormalizedGeoFeature } from "../choroplethMap/data";

export interface BuildChoroplethMapContextInput {
  title?: string;
  renderer: "svg" | "canvas" | "webgpu";
  projection: string;
  features: NormalizedGeoFeature[];
  matchFor: (feature: NormalizedGeoFeature) => ChoroplethDataItem | undefined;
  colorsMapping: Record<string, string>;
  disabledItems?: string[];
  getColor: (matched: ChoroplethDataItem) => string;
  noDataColor: string;
}

export function buildChoroplethMapContext(input: BuildChoroplethMapContextInput): ChoroplethMapChartContext {
  const regions: ChoroplethRegionContext[] = input.features.map((f) => {
    const matched = input.matchFor(f);
    return {
      id: f.id,
      label: matched?.label ?? f.name ?? f.id,
      name: f.name,
      value: matched?.value,
      color: matched ? input.getColor(matched) : input.noDataColor,
      matched: !!matched,
    };
  });

  const matchedRegions = regions.filter((r) => r.matched);
  const values = matchedRegions
    .filter((r) => typeof r.value === "number" && Number.isFinite(r.value))
    .map((r) => ({ id: r.id, label: r.label, value: r.value as number }));

  let valueDomain: [number, number] | null = null;
  let lowest: { id: string; label: string; value: number } | null = null;
  let highest: { id: string; label: string; value: number } | null = null;
  for (const v of values) {
    if (!lowest || v.value < lowest.value) lowest = v;
    if (!highest || v.value > highest.value) highest = v;
  }
  if (lowest && highest) valueDomain = [lowest.value, highest.value];

  const titlePart = input.title ? `"${input.title}" ` : "";
  let summary = `Choropleth map ${titlePart}shows ${regions.length} region${regions.length === 1 ? "" : "s"}, ${
    matchedRegions.length
  } with data (${regions.length - matchedRegions.length} unmatched).`;
  if (lowest && highest && lowest.id !== highest.id) {
    summary += ` Lowest: ${lowest.label} (${lowest.value}). Highest: ${highest.label} (${highest.value}).`;
  }

  const legendData = buildLegendData({
    labels: matchedRegions.map((r) => r.label),
    colorsMapping: input.colorsMapping,
    disabledItems: input.disabledItems,
  });

  return {
    chartType: "choropleth-map-chart",
    title: input.title,
    renderer: input.renderer,
    projection: input.projection,
    stats: {
      featureCount: regions.length,
      matchedCount: matchedRegions.length,
      unmatchedCount: regions.length - matchedRegions.length,
      valueDomain,
      lowest,
      highest,
    },
    regions,
    colorsMapping: input.colorsMapping,
    legendData,
    summary,
    a11yTable: {
      headers: ["Region", "Value", "Matched"],
      rows: regions.map((r) => [r.label, r.value ?? "", r.matched ? "yes" : "no"]),
    },
  };
}
