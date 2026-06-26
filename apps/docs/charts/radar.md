---
title: Radar Chart
---
# Radar Chart

<span class="vp-badge tip">Comparison</span>

Compare several entities across a shared set of axes at a glance (a polygon per entity).

<ChartDemo chart="radar-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Usage

::: code-group

```tsx [React]
import { RadarChart } from "@michi-vz/react";

export default () => <RadarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RadarChart } from "@michi-vz/vue";
</script>

<template>
  <RadarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { radarChart } from "@michi-vz/svelte";
</script>

<div use:radarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRadarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-radar-chart #c></michi-vz-radar-chart>
applyRadarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Engine]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `RadarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
