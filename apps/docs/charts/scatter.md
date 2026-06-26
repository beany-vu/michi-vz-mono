---
title: Scatter Plot
---
# Scatter Plot

<span class="vp-badge tip">Correlation</span>

Relationship between two numeric variables; bubble size encodes a third. Pearson correlation is surfaced in getContext().

<ChartDemo chart="scatter-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

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

Props are typed as `ScatterChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
