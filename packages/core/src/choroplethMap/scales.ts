// ChoroplethMap projection dispatch - thin, chart-named wrappers over the SHARED
// geo/projections.ts (mechanically extracted there when SymbolMapChart (B2.3)
// needed the same dispatch for its optional backdrop-geography mode). Public API
// unchanged: createChoroplethProjection/createChoroplethPathGenerator/
// DEFAULT_PROJECTION still live here so nothing importing them needs to change.
// See geo/projections.ts for the ported legacy MapChoropleth/MakeProjection.js
// formula this delegates to.
import { createTunedProjection, createGeoPathGenerator } from "../geo/projections";
import type { GeoProjection, GeoPath } from "d3-geo";
import type { ChoroplethMapChartProps } from "../types";

export type ChoroplethProjectionName = NonNullable<ChoroplethMapChartProps["projection"]>;
export type ChoroplethProjectionConfig = NonNullable<ChoroplethMapChartProps["projectionConfig"]>;

export const DEFAULT_PROJECTION: ChoroplethProjectionName = "geoRobinson";

export function createChoroplethProjection(
  name: ChoroplethProjectionName | undefined,
  config: ChoroplethProjectionConfig | undefined,
  width: number,
  height: number
): GeoProjection {
  return createTunedProjection(name, config, width, height, { rotate: [-18, 0], center: [0, 10] });
}

/** geoPath(projection[, context]) - d3-geo renders natively to both SVG path
 * strings (context omitted) and Canvas 2D contexts (context supplied); see
 * renderSvg.ts / renderCanvas.ts. */
export function createChoroplethPathGenerator(projection: GeoProjection, context?: CanvasRenderingContext2D): GeoPath {
  return createGeoPathGenerator(projection, context);
}
