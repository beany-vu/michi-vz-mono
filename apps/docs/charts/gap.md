---
title: Gap Chart
description: "Gap chart: plot two values per label (before and after, target and actual) and the bar between them is the story; the wider the gap, the louder it reads."
---
# Gap Chart

<span class="vp-badge tip">Comparison</span>

How far apart are the two numbers that matter? Plot before and after, target and actual, men and women, and the bar between them is the story - the wider the gap, the louder it reads.

<ChartDemo chart="gap-chart" :legend="false" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **Target vs actual, before vs after, forecast vs outturn.** Two values per row where the distance between them is the headline - the gap bar IS the finding.
- **Ranking by gap.** Sort the rows and the biggest wins (or worst misses) surface instantly - built for the Monday-morning review of who closed their gap.
- **If the absolute sizes matter more than the difference**, side-by-side sub-bars on a [Comparable bar](/charts/comparable) keep both magnitudes readable.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
// Life expectancy at birth, 1990 -> 2023 for ~195 countries, sorted by 2023 value
// and coloured by region. Synthetic but shaped like the real story: nearly every
// country gains, and the lower the 1990 start the bigger the catch-up.
function makeGap() {
  const regions = [
    { name: "Africa", color: "#e07b39", count: 54, base: 50, spread: 9, gain: 11 },
    { name: "Asia", color: "#2a9d8f", count: 48, base: 62, spread: 8, gain: 9 },
    { name: "Americas", color: "#457b9d", count: 35, base: 67, spread: 6, gain: 6 },
    { name: "Europe", color: "#9b5de5", count: 44, base: 72, spread: 4, gain: 6 },
    { name: "Oceania", color: "#d7263d", count: 14, base: 64, spread: 8, gain: 7 },
  ];
  const dataSet = [];
  const colorsMapping = {};
  for (const r of regions) {
    for (let i = 0; i < r.count; i++) {
      const v1990 = r.base + (Math.random() - 0.5) * 2 * r.spread;
      const gain = Math.max(-1.5, r.gain * (0.35 + Math.random() * 0.9));
      const v2023 = Math.min(86, v1990 + gain);
      const label = `${r.name} ${i + 1}`;
      colorsMapping[label] = r.color;
      dataSet.push({
        label,
        code: r.name,
        value1: Math.round(v1990 * 10) / 10,
        value2: Math.round(v2023 * 10) / 10,
        difference: Math.round((v1990 - v2023) * 10) / 10,
        date: "2023",
      });
    }
  }
  // Sorted by where each country ENDS, the wall of dumbbells reads as one sweep.
  dataSet.sort((a, b) => b.value2 - a.value2);
  return {
    title: "Life expectancy at birth: 1990 (circle) to 2023 (triangle), years (synthetic)",
    dataSet,
    colorsMapping,
    xAxisDataType: "number",
    xAxisDomain: [35, 90],
    interactiveRowLabels: true,
    shapeValue1: "circle",
    shapeValue2: "triangle",
    shapesLabelsMapping: { value1: "1990", value2: "2023", gap: "Gain" },
  };
}
</script>

GapChart has an opt-in `renderer="webgpu"` that paints the value1/value2 markers and connecting bars as GPU-instanced shapes while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo
  element="michi-vz-gap-chart"
  :make="makeGap"
  :legend="[
    { label: 'Africa', color: '#e07b39' },
    { label: 'Asia', color: '#2a9d8f' },
    { label: 'Americas', color: '#457b9d' },
    { label: 'Europe', color: '#9b5de5' },
    { label: 'Oceania', color: '#d7263d' },
  ]" caption="~195 countries" />

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

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
