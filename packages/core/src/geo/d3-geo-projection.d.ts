// Minimal ambient typings for d3-geo-projection (the upstream package ships no
// "types" field and no @types/d3-geo-projection exists on npm). Declares only
// the two named exports the house imports (geoRobinson - ChoroplethMap's default
// projection; geoGilbert). Both return a GeoProjection, same shape as every
// d3-geo projection factory, so callers get the identical fluent
// .translate()/.scale()/.rotate() API. Lives in `geo/` (not choroplethMap/) since
// SymbolMapChart's projection dispatch (see geo/projections.ts) shares it too.
declare module "d3-geo-projection" {
  import type { GeoProjection } from "d3-geo";
  export function geoRobinson(): GeoProjection;
  export function geoGilbert(): GeoProjection;
}
