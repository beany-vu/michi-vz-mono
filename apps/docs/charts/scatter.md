---
title: Scatter Plot
description: "Scatter plot with trend, clusters, and outliers at a glance; bubble size carries a third variable and the Pearson correlation comes back in getContext()."
---
# Scatter Plot

<span class="vp-badge tip">Correlation</span>

Does more of X really move Y, or are you chasing a coincidence? Plot your points and the trend, the clusters, and the outliers all surface at a glance, with bubble size carrying a third variable for free. The Pearson correlation comes back in getContext(), so you can quote the number instead of squinting at the cloud.

<ChartDemo chart="scatter-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **Testing a hypothesis.** Does spend move conversion? Does tenure move churn? The cloud, the trend and the outliers answer at a glance, and `getContext()` hands you the Pearson r to quote in the write-up.
- **Finding segments before the average hides them.** Clusters and outliers jump out of a scatter long before they surface in a summary table - the analyst's first look at any new dataset.
- **If one axis is time, use a [Line chart](/charts/line)** - a scatter treats time as just another number and loses the reading order your audience expects.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeScatter() {
  const clusters = [
    { label: "Cluster A", color: "#e63946", cx: 25, cy: 70 },
    { label: "Cluster B", color: "#1d3557", cx: 70, cy: 60 },
    { label: "Cluster C", color: "#2a9d8f", cx: 50, cy: 30 },
    { label: "Cluster D", color: "#e9c46a", cx: 80, cy: 25 },
    { label: "Cluster E", color: "#9b5de5", cx: 35, cy: 40 },
  ];
  const g = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const dataSet = [];
  const colorsMapping = {};
  for (const c of clusters) colorsMapping[c.label] = c.color;
  for (let i = 0; i < 50000; i++) {
    const c = clusters[i % clusters.length];
    dataSet.push({
      label: c.label,
      x: Math.max(0, Math.min(100, c.cx + g() * 7)),
      y: Math.max(0, Math.min(100, c.cy + g() * 7)),
    });
  }
  return { dataSet, colorsMapping, xAxisDataType: "number", xAxisDomain: [0, 100], yAxisDomain: [0, 100], sizeRange: [2, 2] };
}
</script>

ScatterChart has an opt-in `renderer="webgpu"` that paints the point cloud as GPU-instanced circles while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-scatter-chart" :make="makeScatter" caption="50,000 points" />

## Usage

::: code-group

```tsx [React]
import { ScatterChart } from "@michi-vz/react";

export default () => <ScatterChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ScatterChart } from "@michi-vz/vue";
</script>

<template>
  <ScatterChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { scatterChart } from "@michi-vz/svelte";
</script>

<div use:scatterChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyScatterChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-scatter-chart #c></michi-vz-scatter-chart>
applyScatterChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-scatter-chart id="c"></michi-vz-scatter-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountScatterChart } from "@michi-vz/core";

const chart = mountScatterChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `ScatterChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
