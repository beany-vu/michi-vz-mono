---
title: Choropleth Map
description: "World/region choropleth: your own GeoJSON, shaded by a threshold colour scale or an explicit category map. 13 d3-geo/d3-geo-projection projections; SVG, canvas, and a delegated WebGPU layer."
---
# Choropleth Map

<span class="vp-badge tip">Geography</span>

The library's first **geo** chart: shade a world or region map by value. Continuous data (export value, an index, a share) drives a threshold colour scale; categorical data (a "latest available year" bucket, a status) drives an explicit label → colour map. Geography is **always a prop** - this package bundles no topology data, so you import your own world/region GeoJSON and pass it straight through.

<ChartDemo chart="choropleth-map-chart" :legend="[]" />

Categorical mode - `colorsMapping` wins over `colorScale` (the sdg-trade **Data Availability** use case: a handful of fixed label → colour buckets, not a numeric gradient):

<ChartDemo chart="choropleth-map-chart" :index="1" :legend="[]" />

::: warning Demo geography only
The world atlas on this page is a simplified public-domain GeoJSON file bundled with the docs examples for illustration. Boundaries, names, and shapes are NOT authoritative. Review the borders and naming of the `geography` file you pass against your organization's cartographic policy before production use: the library renders the file as-is and applies no corrections.
:::

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Bring your own geography

`geography` accepts either a full GeoJSON `FeatureCollection` or a pre-normalized `GeoFeatureItem[]` (`{ id, geometry, name? }`). Nothing about the shapes is bundled in `@michi-vz/core` - import a world map once in your app and reuse it across every choropleth:

```ts
import worldJson from "./world.json"; // your own GeoJSON FeatureCollection
import { ChoroplethMapChart } from "@michi-vz/react";

<ChoroplethMapChart
  geography={worldJson}
  dataSet={[
    { id: "USA", label: "United States", value: 2450 },
    { id: "DEU", label: "Germany", value: 1870 },
    // ...
  ]}
  colorScale={{ domain: [500, 1000, 2000], range: ["#eaf3fb", "#5b9bd5", "#123a63"] }}
/>
```

A `FeatureCollection`'s per-feature `id` is read from the GeoJSON `Feature.id` (falling back to `properties.id`); `name` from `properties.name`. Popular sources: [world-atlas](https://github.com/topojson/world-atlas) (TopoJSON - convert with `topojson-client`'s `feature()`), [Natural Earth](https://www.naturalearthdata.com/), or a region-specific file your own team maintains. The demo above, and this package's own examples, use a real 176-country world atlas (ISO-A3 ids) so the shapes on screen are actual coastlines - `@michi-vz/core` itself still bundles no topology data; the GeoJSON lives only in `@michi-vz/examples`, one directory up from your own app's copy.

## Usage

::: code-group

```tsx [React]
import { ChoroplethMapChart } from "@michi-vz/react";

export default () => <ChoroplethMapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ChoroplethMapChart } from "@michi-vz/vue";
</script>

<template>
  <ChoroplethMapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { choroplethMapChart } from "@michi-vz/svelte";
</script>

<div use:choroplethMapChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyChoroplethMapChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-choropleth-map-chart #c></michi-vz-choropleth-map-chart>
applyChoroplethMapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-choropleth-map-chart id="c"></michi-vz-choropleth-map-chart>
<script>
  Object.assign(document.getElementById("c"), props); // geography, dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountChoroplethMapChart } from "@michi-vz/core";

const chart = mountChoroplethMapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `ChoroplethMapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).

## Behaviour notes

### Joining `dataSet` to `geography` - `joinBy`

Each `dataSet` row (`{ id, label, value?, color? }`) is matched against a geography feature by `joinBy`: `"id"` (default) matches `ChoroplethDataItem.id` against `GeoFeatureItem.id` / GeoJSON `Feature.id` - the clean, stable join (e.g. ISO-A3 codes). `"name"` matches `label` against `GeoFeatureItem.name` / `properties.name` instead, for data keyed by country name rather than code. A feature with no matching row (or a row in `disabledItems`) renders `noDataColor` and its tooltip receives the fallback `{ id, name }` shape instead of the full row.

### Colour resolution precedence

`colorsMapping[label]` (categorical, explicit) wins over `colorScale` (continuous - a resolved hex `range` + numeric `domain`, built into a d3 `scaleThreshold`; values outside the domain clamp to the first/last range colour) wins over the row's own `color` wins over the auto-assigned `colors` palette. Core stays free of `d3-scale-chromatic` - pass already-resolved hex colours to `colorScale.range`, generating them from a named scheme (or anywhere else) in your own app if you want one.

### Projections - all 13, one default

`projection` dispatches to any of `geoEqualEarth`, `geoMercator`, `geoTransverseMercator`, `geoAlbers`, `geoAlbersUsa`, `geoAzimuthalEqualArea`, `geoAzimuthalEquidistant`, `geoOrthographic`, `geoConicConformal`, `geoConicEqualArea`, `geoConicEquidistant`, `geoRobinson` (the default), and `geoGilbert` (both from `d3-geo-projection`). `projectionConfig` (`scale`, `rotate`, `center`, `parallels`) fine-tunes the chosen projection; omitted fields fall back to the legacy sdg-trade `MapChoropleth` chart's own defaults (`rotate: [-18, 0]`, `center: [0, 10]`, a width-derived base scale) rather than `projection.fitSize` - this matches that chart's visual result exactly rather than re-fitting to a different framing. `geoAlbersUsa` is a fixed composite projection: it ignores `rotate` / `center` / `parallels`.

### Rendering: SVG, canvas, and a delegated WebGPU

`renderer="svg"` (default) draws one `<path class="region">` per feature. `renderer="canvas"` draws via `geoPath(projection, ctx)` - d3-geo renders natively and efficiently straight to a 2D canvas context, so nothing re-parses the SVG path string or reimplements projection math. `renderer="webgpu"` **delegates** to the same canvas-2D renderer rather than tessellating arbitrary polygons on the GPU: real-world regions are frequently concave, multi-ring, and hole-containing (an enclave, an island group), and correct GPU triangulation of arbitrary simple polygons needs real ear-clipping - disproportionate scope next to d3-geo's already-fast native 2D path rendering for a typically dozens-to-low-hundreds-of-paths chart. It still capability-gates on `navigator.gpu` and reports the effective renderer via `getContext().renderer`, same as every other chart.

### Hover / tooltip

`tooltipFormatter(d)` receives the full `ChoroplethDataItem` for a matched region, or `{ id, name }` for an unmatched one. In canvas/webgpu mode, hovering is resolved by re-projecting each feature's raw geometry and running a point-in-polygon test (not a bounding-box approximation), so irregular borders hit-test correctly. Hovering dims every other region (the house's standard `highlightItems` behaviour) rather than a persistent CSS `:hover` border-darken - the legacy chart's own hover effect.

### Loading / no-data

`isLoading` and `isNodata` drive the overlay (React: `isLoadingComponent` / `isNodataComponent`), identical to every other chart in the house.

> **Consumer colour authorities:** the context carries `legendData` (`{ label, color, dataLabelSafe }`) so a CSS-injection colour system can key per-label rules; `onChartDataProcessed` is only emitted when the context **changes**.

- Every feature in `geography` is rendered. Legacy consumers that special-cased
  certain features as invisible (e.g. sdg-trade's old chart skipped Antarctica,
  feature id `ATA`) should filter those features out of the `geography` prop
  before passing it in — the chart does not special-case any feature id.
