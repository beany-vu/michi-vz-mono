---
title: Gap Chart
description: "Gap chart: plot two values per label (before and after, target and actual) and the bar between them is the story; the wider the gap, the louder it reads."
---
# Gap Chart

<span class="vp-badge tip">Comparison</span>

How far apart are the two numbers that matter? Plot before and after, target and actual, men and women, and the bar between them is the story - the wider the gap, the louder it reads.

<ChartDemo chart="gap-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeGap() {
  const countries = [
    { label: "United States", code: "USA" },
    { label: "Russia", code: "RUS" },
    { label: "Germany", code: "DEU" },
    { label: "China", code: "CHN" },
    { label: "United Kingdom", code: "GBR" },
    { label: "India", code: "IND" },
    { label: "Brazil", code: "BRA" },
    { label: "Japan", code: "JPN" },
    { label: "France", code: "FRA" },
    { label: "Canada", code: "CAN" },
    { label: "Australia", code: "AUS" },
    { label: "South Africa", code: "ZAF" },
  ];
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const c = countries[i % countries.length];
    const value1 = 2 + Math.random() * 20;
    const value2 = 2 + Math.random() * 20;
    dataSet.push({
      label: `${c.label} #${i}`,
      code: c.code,
      value1,
      value2,
      difference: value1 - value2,
      date: "2023",
    });
  }
  return {
    dataSet,
    xAxisDataType: "number",
    shapeValue1: "circle",
    shapeValue2: "triangle",
    shapesLabelsMapping: { value1: "2010", value2: "2023", gap: "Change" },
  };
}
</script>

GapChart has an opt-in `renderer="webgpu"` that paints the value1/value2 markers and connecting bars as GPU-instanced shapes while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-gap-chart" :make="makeGap" caption="~120 rows" />

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
// main.ts - register the elements once
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

```ts [Vanilla JS]
import { mountGapChart } from "@michi-vz/core";

const chart = mountGapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `GapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
