---
"@michi-vz/core": minor
"@michi-vz/react": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

New chart: **ChoroplethMapChart** - the library's FIRST geo chart, a world/region
choropleth. Migration target for legacy sdg-trade `MapChoropleth` (`Chart.js` +
`MakeProjection.js` + `MakeColors.js`).

- **Geography is ALWAYS a consumer prop.** `@michi-vz/core` bundles NO topology
  data - pass a GeoJSON `FeatureCollection` (its own `Feature.id`/`properties.name`
  are read automatically) or a pre-normalized `GeoFeatureItem[]`. New dependencies:
  `d3-geo` + `d3-geo-projection` (for `geoRobinson`, the default, and `geoGilbert`);
  tree-shaking verified - an esbuild bundle importing only `mountLineChart` from the
  built `dist/index.js` contains zero `geoRobinson`/`geoGilbert`/choropleth symbols.
- All 13 `d3-geo`/`d3-geo-projection` projections (`geoEqualEarth`, `geoMercator`,
  `geoTransverseMercator`, `geoAlbers`, `geoAlbersUsa`, `geoAzimuthalEqualArea`,
  `geoAzimuthalEquidistant`, `geoOrthographic`, `geoConicConformal`,
  `geoConicEqualArea`, `geoConicEquidistant`, `geoRobinson`, `geoGilbert`).
  `projectionConfig` defaults (rotate `[-18, 0]`, center `[0, 10]`, a width-derived
  base scale) reproduce the legacy chart's own default view exactly, rather than
  `projection.fitSize`.
- `dataSet` rows (`{ id, label, value?, color? }`) join geography features by
  `joinBy: "id"` (default - ISO-A3-style codes, matches sdg-trade's real indicator
  map consumer) or `"name"` (matches the legacy chart's own default, for data keyed
  by country name).
- Colour resolution: `colorsMapping` (categorical - the sdg-trade Data Availability
  use case) wins over `colorScale` (continuous - a resolved hex `range` + numeric
  `domain` built into a d3 `scaleThreshold`; core stays free of
  `d3-scale-chromatic`) wins over the row's own `color` wins over the palette.
  Unmatched features render `noDataColor` (default `#d2d7dd`, ported from
  `colors.WHITE_SMOKE_DARKEST`).
- Canvas renderer draws via `geoPath(projection, ctx)` (d3-geo renders natively to
  a 2D context - no path-string reparsing). WebGPU renderer DELEGATES to the
  canvas-2D renderer rather than tessellating arbitrary polygons on the GPU
  (real-world regions are frequently concave/multi-ring/hole-containing; correct
  GPU triangulation needs real ear-clipping, disproportionate scope here) -
  documented at length in `renderWebgpu.ts`; always paints synchronously.
- Host-level hover hit-test for canvas/webgpu mode uses pure-JS even-odd
  ray-casting against the re-projected raw geometry (handles holes correctly,
  works identically under jsdom and in the browser - no Canvas 2D `isPointInPath`
  dependency).
- `buildChoroplethMapContext`: stats over the JOINED values (matched/unmatched
  counts, lowest/highest), NL summary, a11yTable listing every region + value +
  matched flag. `checkChoroplethMapData` flags unmatched dataSet ids, features
  missing an id, and invalid/empty geometry.
- Full `isLoading`/`isNodata`/`noDataLabel`/`suppressDefaultOverlay` chrome quad,
  `highlightItems`/`disabledItems` dimming, `skipColorMappingDispatch`,
  `tooltipFormatter` (matched rows get the full `ChoroplethDataItem`; unmatched
  features get the fallback `{ id, name }` shape).
- Wrappers: `<michi-vz-choropleth-map-chart>` (wc), `ChoroplethMapChart` (React,
  Vue), `choroplethMapChart` action (Svelte), `applyChoroplethMapChartProps`
  (Angular).
