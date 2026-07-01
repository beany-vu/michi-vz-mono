---
title: Area Chart
---
# Area Chart

<span class="vp-badge tip">Composition</span>

The total is growing, but which slice is driving it? Stack your categories and watch each one's share of the whole expand or shrink across time, so a rising tide and a shifting mix tell their stories at once.

<ChartDemo chart="area-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeArea() {
  const keys = ["Coal", "Natural gas", "Nuclear", "Wind", "Solar"];
  const base = { Coal: 1500, "Natural gas": 1100, Nuclear: 800, Wind: 180, Solar: 30 };
  const drift = { Coal: -0.6, "Natural gas": 0.3, Nuclear: 0.02, Wind: 0.4, Solar: 0.5 };
  const series = [];
  const rows = 1500;
  for (let i = 0; i < rows; i++) {
    const row = { date: i };
    for (const k of keys) {
      const trend = base[k] + drift[k] * i;
      const noise = (Math.sin(i * 0.37 + k.length) + Math.random() - 0.5) * base[k] * 0.03;
      row[k] = Math.max(0, trend + noise);
    }
    series.push(row);
  }
  return { series, keys, xAxisDataType: "number" };
}
</script>

AreaChart has an opt-in `renderer="webgpu"` that paints the stacked bands on the GPU while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically.

<WebgpuHeavyDemo element="michi-vz-area-chart" :make="makeArea" caption="~7,500 points" />

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

Props are typed as `AreaChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
