---
title: Pie / Donut
---
# Pie / Donut

<span class="vp-badge tip">Composition</span>

"What share does each part take of the whole?" The oldest question in charting, and a pie still answers it best when there are only a handful of slices. Each wedge is sized by value and labelled with its percentage; slices sort by value so the biggest reads first. Want a donut instead? It is the **same chart** - set `innerRadiusRatio` above 0 to carve out the hole (the context then reports `mode: "donut"`).

<ChartDemo chart="pie-chart" />

The donut variant is one prop away - here the same shares with `innerRadiusRatio: 0.6`, a small `padAngle`, and rounded corners:

<ChartDemo chart="pie-chart" :index="1" />

> Keep slice counts low (≈ 6 or fewer). For many categories, a [bar](/charts/comparable) or [treemap](/charts/treemap) reads more precisely than a pie.

## Usage

::: code-group

```tsx [React]
import { PieChart } from "@michi-vz/react";

export default () => <PieChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { PieChart } from "@michi-vz/vue";
</script>

<template>
  <PieChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { pieChart } from "@michi-vz/svelte";
</script>

<div use:pieChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyPieChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-pie-chart #c></michi-vz-pie-chart>
applyPieChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-pie-chart id="c"></michi-vz-pie-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, innerRadiusRatio, …
</script>
```

```ts [Vanilla JS]
import { mountPieChart } from "@michi-vz/core";

const chart = mountPieChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Data shape

Each `dataSet` item is one slice: a `label`, a `value`, and an optional `color`.

```ts
const props = {
  innerRadiusRatio: 0, // 0 = pie; e.g. 0.6 = donut
  showLabels: true,    // % labels inside large-enough slices
  showLegend: true,
  dataSet: [
    { label: "Industry", value: 281, color: "#005aba" },
    { label: "Agri-food", value: 381, color: "#f0a500" },
    { label: "Materials", value: 132, color: "#2aa39a" },
  ],
};
```

## Pie vs donut

One engine renders both. `innerRadiusRatio` is the hole as a fraction of the outer radius: `0` is a solid pie, `0.6` a donut. `padAngle` (radians) adds a gap between slices and `cornerRadius` rounds the arc corners. The slices, tooltip, `getContext()` and SVG/canvas parity are identical either way.

## API

Props are typed as `PieChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context). Full reference: [Pie / Donut API](/api/pie).
