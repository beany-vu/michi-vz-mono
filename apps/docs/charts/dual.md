---
title: Dual Horizontal Bar (Tornado)
---
# Dual Horizontal Bar (Tornado)

<span class="vp-badge tip">Comparison</span>

Diverging bars from a centre line - value1 right, value2 left (population pyramids, tornado charts).

<ChartDemo chart="dual-horizontal-bar-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Usage

::: code-group

```tsx [React]
import { DualHorizontalBarChart } from "@michi-vz/react";

export default () => <DualHorizontalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { DualHorizontalBarChart } from "@michi-vz/vue";
</script>

<template>
  <DualHorizontalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { dualHorizontalBarChart } from "@michi-vz/svelte";
</script>

<div use:dualHorizontalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyDualHorizontalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-dual-horizontal-bar-chart #c></michi-vz-dual-horizontal-bar-chart>
applyDualHorizontalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-dual-horizontal-bar-chart id="c"></michi-vz-dual-horizontal-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Engine]
import { mountDualHorizontalBarChart } from "@michi-vz/core";

const chart = mountDualHorizontalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `DualHorizontalBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
