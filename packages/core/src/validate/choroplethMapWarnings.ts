// onDataWarning checks for ChoroplethMap: dataSet rows that matched no geography
// feature, geography features missing an id (can never be joined), and features
// with invalid/empty geometry (can never be drawn - see renderModel.ts's `d: null`).
import { normalizeGeography } from "../choroplethMap/data";
import type { ChoroplethDataItem, DataWarning, GeoFeatureItem } from "../types";

function hasCoordinates(geometry: GeoJSON.Geometry | null | undefined): boolean {
  if (!geometry) return false;
  if (geometry.type === "GeometryCollection") return geometry.geometries.length > 0;
  const coords = (geometry as { coordinates?: unknown }).coordinates;
  return Array.isArray(coords) && coords.length > 0;
}

export function checkChoroplethMapData(
  geography: GeoJSON.FeatureCollection | GeoFeatureItem[],
  dataSet: ChoroplethDataItem[],
  joinBy: "id" | "name" = "id"
): DataWarning[] {
  const warnings: DataWarning[] = [];
  const features = normalizeGeography(geography ?? []);

  for (const f of features) {
    const key = joinBy === "name" ? f.name : f.id;
    if (!key) {
      warnings.push({
        type: "missing-feature-id",
        message: `A geography feature is missing ${joinBy === "name" ? "properties.name" : "an id"} and can never be joined.`,
      });
    }
    if (!hasCoordinates(f.geometry)) {
      warnings.push({
        type: "invalid-geometry",
        message: `Feature "${f.id || f.name || "(unknown)"}" has invalid or empty geometry and will not be drawn.`,
        label: f.id || f.name,
      });
    }
  }

  const featureKeys = new Set(features.map((f) => (joinBy === "name" ? f.name : f.id)).filter(Boolean));
  for (const d of dataSet ?? []) {
    const key = joinBy === "name" ? d.label : d.id;
    if (!featureKeys.has(key)) {
      warnings.push({
        type: "unmatched-dataset-id",
        message: `dataSet item "${d.label}" (${key}) did not match any geography feature.`,
        label: d.label,
      });
    }
  }

  return warnings;
}
