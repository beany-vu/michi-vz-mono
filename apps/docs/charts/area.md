---
title: Area Chart
---
# Area Chart

<span class="vp-badge tip">Composition</span>

Part-to-whole over time: how each component’s share of a stacked total shifts.

<ChartDemo chart="area-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Usage

::: code-group

```tsx [React]
import { AreaChart } from "@michi-vz/react";

export default () => <AreaChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { AreaChart } from "@michi-vz/vue";
</script>

<template>
  <AreaChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { areaChart } from "@michi-vz/svelte";
</script>

<div use:areaChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyAreaChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-area-chart #c></michi-vz-area-chart>
applyAreaChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-area-chart id="c"></michi-vz-area-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountAreaChart } from "@michi-vz/core";

const chart = mountAreaChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `AreaChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
