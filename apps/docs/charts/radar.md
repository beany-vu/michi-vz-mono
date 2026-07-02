---
title: Radar Chart
description: "Radar chart for comparing options across shared criteria: each candidate becomes a polygon whose spikes and dents show strengths and weaknesses at a glance."
---
# Radar Chart

<span class="vp-badge tip">Comparison</span>

Which option wins, and where? Lay a few candidates over the same set of criteria and each one becomes a polygon you can read in a glance - the spikes show every strength, the dents show every weakness, and the overlaps show exactly where they trade places.

<ChartDemo chart="radar-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeRadar() {
  const axes = [
    "Healthcare", "Education", "Cost of living", "Safety",
    "Environment", "Culture", "Infrastructure", "Climate",
    "Jobs", "Nightlife", "Walkability", "Diversity",
  ];
  const palette = ["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e"];
  const names = ["Vienna", "Singapore", "Lisbon", "Auckland"];
  const series = names.map((label, i) => ({
    label,
    color: palette[i],
    values: axes.map(() => Math.round(20 + Math.random() * 80)),
  }));
  return { axes, series, maxValue: 100, fillOpacity: 0.2 };
}
</script>

RadarChart has an opt-in `renderer="webgpu"` that paints the polygon fills and pole markers as GPU-instanced marks while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-radar-chart" :make="makeRadar" caption="12 axes × 4 series" />

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

```ts [Vanilla JS]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `RadarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
