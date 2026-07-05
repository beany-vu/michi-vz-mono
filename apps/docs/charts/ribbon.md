---
title: Ribbon Chart
description: "Ribbon chart for rank and share shifts: ribbons connect each period's columns so you can follow a category as it swells, shrinks, and trades places."
---
# Ribbon Chart

<span class="vp-badge tip">Composition</span>

Who's gaining and who's slipping? When market share, budget splits, or vote tallies reshuffle from one period to the next, the ribbons connecting each column let you follow a single category as it swells, shrinks, and trades places with its rivals.

<ChartDemo chart="ribbon-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **Market share, budget splits, league tables.** When categories trade places period to period, the ribbons make "who overtook whom, and when" the first thing readers see.
- **Presenting reshuffles to a business audience.** Each category keeps its colour as it swells, shrinks and swaps ranks, so the eye follows one competitor through the whole story.
- **If nothing ever swaps ranks**, the ribbons run parallel and an [Area chart](/charts/area) tells the same share story with less ink.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeRibbon() {
  const keys = Array.from({ length: 30 }, (_, i) => `Category ${i + 1}`);
  const palette = [
    "#e63946", "#1d3557", "#2a9d8f", "#e9c46a", "#9b5de5",
    "#f15bb5", "#00bbf9", "#00f5d4", "#fee440", "#4cb944",
  ];
  const colorsMapping = {};
  keys.forEach((k, i) => { colorsMapping[k] = palette[i % palette.length]; });
  // Each key gets a slowly drifting base weight so ribbons visibly swell/shrink/re-rank.
  const bases = keys.map(() => 2 + Math.random() * 8);
  const drifts = keys.map(() => (Math.random() - 0.5) * 0.8);
  const series = [];
  for (let p = 0; p < 15; p++) {
    const row = { date: `${2010 + p}` };
    keys.forEach((k, i) => {
      const wobble = Math.sin(p * 0.7 + i) * 1.5;
      row[k] = Math.max(0.5, bases[i] + drifts[i] * p + wobble);
    });
    series.push(row);
  }
  return { series, keys, colorsMapping };
}
</script>

RibbonChart has an opt-in `renderer="webgpu"` that paints its ribbons on the GPU while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-ribbon-chart" :make="makeRibbon" caption="dense ribbons" />

## Usage

::: code-group

```tsx [React]
import { RibbonChart } from "@michi-vz/react";

export default () => <RibbonChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RibbonChart } from "@michi-vz/vue";
</script>

<template>
  <RibbonChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { ribbonChart } from "@michi-vz/svelte";
</script>

<div use:ribbonChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRibbonChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-ribbon-chart #c></michi-vz-ribbon-chart>
applyRibbonChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRibbonChart } from "@michi-vz/core";

const chart = mountRibbonChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `RibbonChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
