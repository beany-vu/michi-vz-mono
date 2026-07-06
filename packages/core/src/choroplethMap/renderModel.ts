// Renderer-agnostic ChoroplethMap model: one mark per geography feature (a
// region), fill resolved via the joined ChoroplethDataItem (or `noDataColor` when
// unmatched), plus a precomputed SVG path `d` string. Canvas/webgpu draw the RAW
// geometry directly through geoPath(projection, ctx) (see renderCanvas.ts) rather
// than re-parsing the `d` string - d3-geo renders natively to a 2D context.
import { sanitizeForClassName } from "../math/sanitize";
import type { ChoroplethDataItem } from "../types";
import type { NormalizedGeoFeature } from "./data";
import type { ChoroplethColorResolver } from "./colors";
import { createChoroplethPathGenerator } from "./scales";
import type { GeoProjection } from "d3-geo";

export interface ChoroplethFeatureMark {
  id: string;
  safe: string;
  name?: string;
  geometry: GeoJSON.Geometry;
  /** The joined row, or undefined when this feature had no match (renders `noDataColor`). */
  matched?: ChoroplethDataItem;
  color: string;
  dimmed: boolean;
  /** Precomputed SVG path `d`; null when geoPath could not project the geometry
   * (e.g. empty/invalid rings - see choroplethMapWarnings.ts's "invalid-geometry"). */
  d: string | null;
}

export interface ChoroplethMapRenderModel {
  features: ChoroplethFeatureMark[];
  projection: GeoProjection;
}

export interface BuildChoroplethModelOptions {
  highlightItems: string[];
  noDataColor: string;
}

export function buildChoroplethRenderModel(
  features: NormalizedGeoFeature[],
  matchFor: (feature: NormalizedGeoFeature) => ChoroplethDataItem | undefined,
  projection: GeoProjection,
  colors: ChoroplethColorResolver,
  o: BuildChoroplethModelOptions
): ChoroplethMapRenderModel {
  const highlightSet = new Set(o.highlightItems);
  const anyHighlight = highlightSet.size > 0;
  const pathGen = createChoroplethPathGenerator(projection);

  const marks: ChoroplethFeatureMark[] = features.map((f) => {
    const matched = matchFor(f);
    const color = matched ? colors.getColor(matched) : o.noDataColor;
    const dimLabel = matched?.label ?? f.name ?? f.id;

    let d: string | null = null;
    if (f.geometry) {
      try {
        d = pathGen({ type: "Feature", properties: {}, geometry: f.geometry });
      } catch {
        d = null;
      }
    }

    return {
      id: f.id,
      safe: sanitizeForClassName(f.id || f.name || ""),
      name: f.name,
      geometry: f.geometry,
      matched,
      color,
      dimmed: anyHighlight && !highlightSet.has(dimLabel),
      d,
    };
  });

  return { features: marks, projection };
}
