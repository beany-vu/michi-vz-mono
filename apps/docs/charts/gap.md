---
title: Gap Chart
---
# Gap Chart

<span class="vp-badge tip">Comparison</span>

Two values per label joined by a gap bar — emphasises the difference between them.

<ChartDemo chart="gap-chart" />

> The chart above is the **same engine** in every framework — only the integration code below differs.

## Usage

::: code-group

```tsx [React]
import { GapChart } from "@michi-vz/react";

export default () => <GapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { GapChart } from "@michi-vz/vue";
</script>

<template>
  <GapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { gapChart } from "@michi-vz/svelte";
</script>

<div use:gapChart={props}></div>
```

```ts [Angular]
// main.ts — register the elements once
import "@michi-vz/angular";
import { applyGapChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-gap-chart #c></michi-vz-gap-chart>
applyGapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-gap-chart id="c"></michi-vz-gap-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Engine]
import { mountGapChart } from "@michi-vz/core";

const chart = mountGapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `GapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
