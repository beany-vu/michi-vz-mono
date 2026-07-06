---
title: Symbol Map
description: "A force-de-overlapped symbol/bubble map: you supply lng/lat per item, a one-shot d3-force simulation pulls overlapping circles apart. Dot-only by default (legacy parity); an optional muted backdrop landmass is available. SVG, canvas, and a delegated WebGPU layer."
---
# Symbol Map

<span class="vp-badge tip">Geography</span>

Chart #20: a force-de-overlapped bubble map. Migration target for legacy sdg-trade **MapSymbolForce** - a dot-only bubble map where each item's coordinates project onto the plane, then a one-shot force simulation nudges overlapping circles apart just enough to be readable, without moving them far from their true position. Unlike [Choropleth Map](/charts/choropleth-map), geography is **optional** here: omit it for the legacy chart's own dot-only look (the default), or supply it to draw a muted backdrop landmass behind the symbols.

<ChartDemo chart="symbol-map-chart" :legend="[]" />

A concentric second ring (`valueSecond`) reads as a sub-metric of the outer circle - e.g. "of which" a specific partner or channel:

<ChartDemo chart="symbol-map-chart" :index="1" :legend="[]" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Bring your own coordinates

Unlike the legacy chart (which bundled a ~200-row static country coordinate CSV), `@michi-vz/core` ships **no** coordinate table. Each `dataSet` item supplies its own `lng`/`lat`:

```ts
import { SymbolMapChart } from "@michi-vz/react";

<SymbolMapChart
  dataSet={[
    { id: "usa", label: "United States", lng: -95.7, lat: 38.9, value: 100 },
    { id: "deu", label: "Germany", lng: 13.4, lat: 52.5, value: 60, valueSecond: 30 },
    // ...
  ]}
/>
```

Because the extent used to fit the dot-only layout to the plot is derived from your own dataset's coordinates (not a bundled, always-full-world table), the "world" the chart draws only spans as far as the points you pass in - see [Behaviour notes](#dot-only-vs-backdrop-projection) below.

## Usage

::: code-group

```tsx [React]
import { SymbolMapChart } from "@michi-vz/react";

export default () => <SymbolMapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { SymbolMapChart } from "@michi-vz/vue";
</script>

<template>
  <SymbolMapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { symbolMapChart } from "@michi-vz/svelte";
</script>

<div use:symbolMapChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applySymbolMapChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-symbol-map-chart #c></michi-vz-symbol-map-chart>
applySymbolMapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-symbol-map-chart id="c"></michi-vz-symbol-map-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountSymbolMapChart } from "@michi-vz/core";

const chart = mountSymbolMapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `SymbolMapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).

## Behaviour notes

### The one-shot force de-overlap

Every item's `lng`/`lat` projects to a "true" pixel position; `forceX`/`forceY` pin the simulation to that exact position as its target, `forceManyBody()` adds mild separation, and `forceCollide` (radius + 2px padding, 3 iterations) is what actually pushes overlapping circles apart. The simulation settles synchronously to the SAME alpha threshold the legacy chart used (`0.0011`) - deterministic: identical inputs always settle to the identical layout, so two mounts of the same data produce pixel-identical positions. Two items with the *exact same* coordinates start stacked and separate cleanly once the simulation settles.

### Dot-only vs. backdrop projection

With no `geography`, the chosen `projection` (default `"geoMercator"`, matching the legacy chart) is used **untuned** - a bare projection factory with none of [Choropleth Map](/charts/choropleth-map)'s translate/scale/rotate/center tuning - and the projected point extent is then rescaled to fill the plot, mirroring the legacy chart's own math. With `geography` supplied, the SAME tuned dispatch Choropleth Map uses takes over instead, so the backdrop landmass and the symbol coordinates share one consistent geographic framing (no extent rescale).

### `radiusVisibleMin` - filtered on the raw value

`radiusVisibleMin` hides items whose **raw** `value` is at or below the threshold (and, when `valueSecond` is set, whose `valueSecond` is also below it) **before** the force layout runs - ported from the legacy chart's own filter, which compared the raw value, never the scaled radius. The radius/opacity scale's domain is still built from every item with valid coordinates regardless of this filter, so a symbol's radius stays comparable across renders even as the threshold changes.

### The concentric second ring

`valueSecond` draws a second circle, same colour as the outer one, at `opacity - 0.3` (clamped to non-negative), drawn ON TOP of the primary circle - ported from the legacy `ForceNode`'s exact layering. When the second circle is smaller than the outer one it reads as a dimmer core inside a lighter ring (e.g. "of which"); when larger, it fully covers the outer circle.

### Optional backdrop geography

`geography` (a GeoJSON `FeatureCollection` or a pre-normalized `GeoFeatureItem[]`, same contract as Choropleth Map's `geography`) is a **new** capability - the legacy chart never drew landmass. Omit it for the dot-only legacy look; supply it for a muted, non-interactive backdrop (`geographyColor`, default `#eef1f5`) behind the symbols.

### Rendering: SVG, canvas, and a delegated WebGPU

`renderer="svg"` (default) draws one `<circle class="symbol">` per visible item (plus an optional `<circle class="symbol-second">`). `renderer="canvas"` paints the same marks to a 2D canvas, resolving fill colour through the same consumer-CSS probe every single-mark chart uses. `renderer="webgpu"` **delegates** to the canvas-2D renderer, same rationale as Choropleth Map: the optional backdrop is arbitrary (possibly concave, multi-ring) GeoJSON, so correct GPU tessellation is disproportionate scope here.

### Loading / no-data

`isLoading` and `isNodata` drive the overlay (React: `isLoadingComponent` / `isNodataComponent`), identical to every other chart in the house.

> **Consumer colour authorities:** the context carries `legendData` (`{ label, color, dataLabelSafe }`) so a CSS-injection colour system can key per-label rules; `onChartDataProcessed` is only emitted when the context **changes**.
