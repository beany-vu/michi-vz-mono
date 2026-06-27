---
title: Ribbon Chart
---
# Ribbon Chart

<span class="vp-badge tip">Composition</span>

Who's gaining and who's slipping? When market share, budget splits, or vote tallies reshuffle from one period to the next, the ribbons connecting each column let you follow a single category as it swells, shrinks, and trades places with its rivals.

<ChartDemo chart="ribbon-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

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

Props are typed as `RibbonChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
