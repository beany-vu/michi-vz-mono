---
title: Dual Horizontal Bar (Tornado)
description: "Dual bar chart (tornado, population pyramid): two opposing values anchored to a shared centre line so the imbalance reads at a glance."
---
# Dual Horizontal Bar (Tornado)

<span class="vp-badge tip">Comparison</span>

Which side wins, and by how much? Anchor two opposing values to a shared centre line and the imbalance reads at a glance - left vs right, men vs women, before vs after. The classic population pyramid and tornado chart, where the longest bar is the story.

<ChartDemo chart="dual-horizontal-bar-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **When asymmetry is the story.** Population pyramids, imports vs exports, promoters vs detractors: two opposing magnitudes on one centre line, and the lopsided side speaks first.
- **Executive one-pagers.** The longest bar and the heavier side communicate before a single number is read - ideal when the audience has ten seconds.
- **If the two values do not oppose each other** (this year vs last year, target vs actual), keep both on the same side of zero with a [Comparable bar](/charts/comparable).

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeDual() {
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const base = 2 + Math.random() * 18;
    const skew = (Math.random() - 0.5) * 6;
    dataSet.push({
      label: `Row ${i + 1}`,
      value1: Number(Math.max(0.1, base + skew).toFixed(1)),
      value2: Number(Math.max(0.1, base - skew).toFixed(1)),
      color: "#3F7CAC",
    });
  }
  return { dataSet, title: "120 diverging rows (synthetic)" };
}
</script>

DualHorizontalBarChart has an opt-in `renderer="webgpu"` that paints value1/value2 bars on the GPU while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-dual-horizontal-bar-chart" :make="makeDual" caption="~120 rows" />

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

```ts [Vanilla JS]
import { mountDualHorizontalBarChart } from "@michi-vz/core";

const chart = mountDualHorizontalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `DualHorizontalBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
