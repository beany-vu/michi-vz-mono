// Shared d3-geo / d3-geo-projection dispatch for every geo chart (ChoroplethMap,
// SymbolMap). Mechanically lifted out of choroplethMap/scales.ts (B2.2) when
// SymbolMapChart (B2.3) needed the SAME projection factories - choroplethMap/
// scales.ts now re-exports thin chart-named wrappers over this module so its own
// public API (createChoroplethProjection/createChoroplethPathGenerator/
// DEFAULT_PROJECTION) is unchanged.
//
// `createTunedProjection` ports legacy sdg-trade MapChoropleth/MakeProjection.js's
// formula EXACTLY (deliberately NOT projection.fitSize/fitExtent): translate to
// the viewport centre, base scale = width/1.7/PI, then rotate/center/parallels
// pass through only when the target projection exposes that method (geoAlbersUsa,
// e.g., has no .rotate/.center/.parallels, being a fixed composite projection).
import {
  geoPath,
  geoEqualEarth,
  geoMercator,
  geoTransverseMercator,
  geoAlbers,
  geoAlbersUsa,
  geoAzimuthalEqualArea,
  geoAzimuthalEquidistant,
  geoOrthographic,
  geoConicConformal,
  geoConicEqualArea,
  geoConicEquidistant,
} from "d3-geo";
import type { GeoProjection, GeoPath } from "d3-geo";
import { geoRobinson, geoGilbert } from "d3-geo-projection";
import type { GeoProjectionName, GeoProjectionConfig } from "../types";

export type { GeoProjectionName, GeoProjectionConfig };

export const PROJECTIONS: Record<GeoProjectionName, () => GeoProjection> = {
  geoEqualEarth,
  geoMercator,
  geoTransverseMercator,
  geoAlbers,
  geoAlbersUsa,
  geoAzimuthalEqualArea,
  geoAzimuthalEquidistant,
  geoOrthographic,
  geoConicConformal,
  geoConicEqualArea,
  geoConicEquidistant,
  geoRobinson,
  geoGilbert,
};

// Narrow, untyped-in-@types/d3-geo method probes (geoAlbersUsa lacks them).
export interface OptionalProjectionMethods {
  rotate?: (angles: [number, number, number?]) => GeoProjection;
  center?: (point: [number, number]) => GeoProjection;
  parallels?: (values: [number, number]) => GeoProjection;
}

export interface TunedProjectionDefaults {
  rotate?: [number, number, number?];
  center?: [number, number];
}

/**
 * A projection scaled/translated/rotated to frame a `width`x`height` viewport -
 * ChoroplethMap's own default view (and SymbolMap's backdrop-geography mode).
 * `defaults` supplies the rotate/center used when `config` omits them (both
 * charts use the legacy MapChoropleth values, [-18, 0] / [0, 10]).
 */
export function createTunedProjection(
  name: GeoProjectionName | undefined,
  config: GeoProjectionConfig | undefined,
  width: number,
  height: number,
  defaults: TunedProjectionDefaults = { rotate: [-18, 0], center: [0, 10] }
): GeoProjection {
  const factory = PROJECTIONS[name ?? "geoRobinson"] ?? geoRobinson;
  let proj = factory()
    .translate([width / 2, height / 2])
    .scale(width / 1.7 / Math.PI);

  const cfg = config ?? {};
  const optional = proj as GeoProjection & OptionalProjectionMethods;

  if (typeof optional.rotate === "function" && defaults.rotate) {
    proj = optional.rotate(cfg.rotate ?? defaults.rotate);
  }
  if (typeof optional.center === "function" && defaults.center) {
    proj = optional.center(cfg.center ?? defaults.center);
  }
  // Explicit scale only (legacy quirk: a falsy/omitted `scale` in projectionConfig
  // falls through to the width-derived base scale above, UNMULTIPLIED - the
  // responsive step-down only kicks in when the caller actually sets a scale).
  if (cfg.scale) {
    let multiplier = 1;
    if (width < 600) multiplier = 0.7;
    if (width < 400) multiplier = 0.5;
    proj = proj.scale(cfg.scale * multiplier);
  }
  if (cfg.parallels && typeof optional.parallels === "function") {
    proj = optional.parallels(cfg.parallels);
  }

  return proj;
}

/** geoPath(projection[, context]) - d3-geo renders natively to both SVG path
 * strings (context omitted) and Canvas 2D contexts (context supplied). */
export function createGeoPathGenerator(projection: GeoProjection, context?: CanvasRenderingContext2D): GeoPath {
  return context ? geoPath(projection, context) : geoPath(projection);
}
