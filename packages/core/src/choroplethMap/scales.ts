// ChoroplethMap projection dispatch. Ported from legacy sdg-trade
// MapChoropleth/MakeProjection.js - deliberately NOT projection.fitSize/fitExtent
// (the legacy chart never used them): translate to the viewport centre, base
// scale = width/1.7/PI (tuned for geoRobinson's default world framing), then
// rotate/center/parallels pass through only when the target projection exposes
// that method (mirrors the legacy `supported` probe array - geoAlbersUsa, e.g.,
// has no .rotate/.center/.parallels, being a fixed composite projection). When
// projectionConfig is entirely omitted the result is pixel-for-pixel the legacy
// chart's own default view (rotate [-18, 0], center [0, 10]).
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
import type { ChoroplethMapChartProps } from "../types";

export type ChoroplethProjectionName = NonNullable<ChoroplethMapChartProps["projection"]>;
export type ChoroplethProjectionConfig = NonNullable<ChoroplethMapChartProps["projectionConfig"]>;

const PROJECTIONS: Record<ChoroplethProjectionName, () => GeoProjection> = {
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

export const DEFAULT_PROJECTION: ChoroplethProjectionName = "geoRobinson";

// Narrow, untyped-in-@types/d3-geo method probes (geoAlbersUsa lacks them).
interface OptionalProjectionMethods {
  rotate?: (angles: [number, number, number?]) => GeoProjection;
  center?: (point: [number, number]) => GeoProjection;
  parallels?: (values: [number, number]) => GeoProjection;
}

export function createChoroplethProjection(
  name: ChoroplethProjectionName | undefined,
  config: ChoroplethProjectionConfig | undefined,
  width: number,
  height: number
): GeoProjection {
  const factory = PROJECTIONS[name ?? DEFAULT_PROJECTION] ?? geoRobinson;
  let proj = factory()
    .translate([width / 2, height / 2])
    .scale(width / 1.7 / Math.PI);

  const cfg = config ?? {};
  const optional = proj as GeoProjection & OptionalProjectionMethods;

  if (typeof optional.rotate === "function") {
    proj = optional.rotate(cfg.rotate ?? [-18, 0]);
  }
  if (typeof optional.center === "function") {
    proj = optional.center(cfg.center ?? [0, 10]);
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
 * strings (context omitted) and Canvas 2D contexts (context supplied); see
 * renderSvg.ts / renderCanvas.ts. */
export function createChoroplethPathGenerator(
  projection: GeoProjection,
  context?: CanvasRenderingContext2D
): GeoPath {
  return context ? geoPath(projection, context) : geoPath(projection);
}
