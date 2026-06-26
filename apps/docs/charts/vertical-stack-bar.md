---
title: Vertical Stack Bar
---
# Vertical Stack Bar

<span class="vp-badge tip">Composition</span>

Stacked vertical bars per category, with an explicit missing-data marker guard for sparse datasets.

<ChartDemo chart="vertical-stack-bar-chart" />

> The chart above is the **same engine** in every framework — only the integration code below differs.

## Usage

::: code-group

```tsx [React]
import { VerticalStackBarChart } from "@michi-vz/react";

export default () => <VerticalStackBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { VerticalStackBarChart } from "@michi-vz/vue";
</script>

<template>
  <VerticalStackBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { verticalStackBarChart } from "@michi-vz/svelte";
</script>

<div use:verticalStackBarChart={props}></div>
```

```ts [Angular]
// main.ts — register the elements once
import "@michi-vz/angular";
import { applyVerticalStackBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-vertical-stack-bar-chart #c></michi-vz-vertical-stack-bar-chart>
applyVerticalStackBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-vertical-stack-bar-chart id="c"></michi-vz-vertical-stack-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Engine]
import { mountVerticalStackBarChart } from "@michi-vz/core";

const chart = mountVerticalStackBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `VerticalStackBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
