// ChoroplethMap data pipeline (pure): normalizes the `geography` prop (a full
// GeoJSON FeatureCollection OR a pre-normalized GeoFeatureItem[]) into a common
// shape, then joins `dataSet` rows against it by id (default) or by name -
// ported from legacy sdg-trade MapChoropleth/Chart.js's dual `uniqueIDKeyMap`
// matching (`d.properties.name` vs `d.id`), expressed via the clean `id`
// contract (see ChoroplethMapChartProps.joinBy JSDoc for the full decision).
import type { ChoroplethDataItem, GeoFeatureItem } from "../types";

export interface NormalizedGeoFeature {
  id: string;
  name?: string;
  geometry: GeoJSON.Geometry;
}

/** Normalize `geography` (FeatureCollection or flat array) to NormalizedGeoFeature[].
 * For a FeatureCollection, `id` reads the GeoJSON top-level `Feature.id` first
 * (NOT `properties.id`), falling back to `properties.id`; `name` reads
 * `properties.name`. Shared by data.ts and choroplethMapWarnings.ts. */
export function normalizeGeography(
  geography: GeoJSON.FeatureCollection | GeoFeatureItem[]
): NormalizedGeoFeature[] {
  if (Array.isArray(geography)) {
    return geography.map((f) => ({ id: f.id, name: f.name, geometry: f.geometry }));
  }
  return (geography.features ?? []).map((f) => {
    const props = (f.properties ?? {}) as Record<string, unknown>;
    const rawId = f.id != null ? f.id : props.id;
    const id = rawId != null ? String(rawId) : "";
    const name = typeof props.name === "string" ? props.name : undefined;
    return { id, name, geometry: f.geometry };
  });
}

export interface ProcessChoroplethOptions {
  /** Labels to exclude from the join; their features render as unmatched (noDataColor). */
  disabledItems?: string[];
  /** "id" (default) joins by GeoFeatureItem.id; "name" joins by GeoFeatureItem.name. */
  joinBy?: "id" | "name";
}

export interface ProcessedChoropleth {
  features: NormalizedGeoFeature[];
  /** Looks up the joined ChoroplethDataItem for a normalized feature, or undefined
   * when no row matched (disabled rows are treated as unmatched too). */
  matchFor: (feature: NormalizedGeoFeature) => ChoroplethDataItem | undefined;
}

export function processChoroplethMapData(
  geography: GeoJSON.FeatureCollection | GeoFeatureItem[],
  dataSet: ChoroplethDataItem[],
  opts: ProcessChoroplethOptions = {}
): ProcessedChoropleth {
  const joinBy = opts.joinBy ?? "id";
  const disabled = new Set(opts.disabledItems ?? []);
  const features = normalizeGeography(geography);

  const byKey = new Map<string, ChoroplethDataItem>();
  for (const d of dataSet ?? []) {
    if (disabled.has(d.label)) continue;
    const key = joinBy === "name" ? d.label : d.id;
    if (key) byKey.set(key, d);
  }

  const matchFor = (feature: NormalizedGeoFeature): ChoroplethDataItem | undefined => {
    const key = joinBy === "name" ? feature.name : feature.id;
    return key ? byKey.get(key) : undefined;
  };

  return { features, matchFor };
}
