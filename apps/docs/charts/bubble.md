---
title: Bubble Chart
description: "Bubble chart with area-true sizing and a gravity layout; each bubble can split into a realized core and an untapped ring, showing size and progress together."
---
# Bubble Chart

<span class="vp-badge tip">Composition</span>

"How big is each one, and how much of it is already realized?" A bubble cloud answers magnitude at a glance: every circle is sized by value (**area**, not radius), and a gravity simulation pulls them into a tidy cluster so the big ones obviously dominate. Like the [treemap](/charts/treemap), each bubble can carry a **two-part split** - a solid realized core inside a lighter untapped ring - so you read size and progress together.

<ChartDemo chart="bubble-chart" />

No split needed? Drop `partial` for a clean proportional cloud, one colour per category:

<ChartDemo chart="bubble-chart" :index="1" />

> The cluster is laid out with [d3-force](https://github.com/d3/d3-force): bubbles fall toward the centre (`gravity`) and push apart so they never overlap (collision). The simulation is settled **synchronously**, so SVG and canvas render the identical, reproducible layout.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeBubble() {
  const categories = [
    { label: "Machinery", color: "#e63946" },
    { label: "Fruits", color: "#1d3557" },
    { label: "Oil seeds", color: "#2a9d8f" },
    { label: "Beverages", color: "#e9c46a" },
    { label: "Ferrous metals", color: "#9b5de5" },
    { label: "Textiles", color: "#f4a261" },
  ];
  const dataSet = [];
  for (let i = 0; i < 2000; i++) {
    const c = categories[i % categories.length];
    dataSet.push({
      label: `${c.label} #${i}`,
      value: 5 + Math.random() * 150,
      color: c.color,
    });
  }
  return { dataSet, gravity: 0.06, padding: 0.5 };
}
</script>

BubbleChart has an opt-in `renderer="webgpu"` that paints the bubble cloud as GPU-instanced circles while labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-bubble-chart" :make="makeBubble" caption="~2,000 bubbles" />

## Usage

::: code-group

```tsx [React]
import { BubbleChart } from "@michi-vz/react";

export default () => <BubbleChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { BubbleChart } from "@michi-vz/vue";
</script>

<template>
  <BubbleChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { bubbleChart } from "@michi-vz/svelte";
</script>

<div use:bubbleChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyBubbleChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-bubble-chart #c></michi-vz-bubble-chart>
applyBubbleChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-bubble-chart id="c"></michi-vz-bubble-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, splitLabels, …
</script>
```

```ts [Vanilla JS]
import { mountBubbleChart } from "@michi-vz/core";

const chart = mountBubbleChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Data shape

Each `dataSet` item is one bubble: a `label`, a `value` (area), an optional `partial` (the realized sub-portion), and an optional `color`.

```ts
const props = {
  splitLabels: ["Realized", "Untapped"],
  showLegend: true,
  gravity: 0.09, // higher = tighter cluster
  dataSet: [
    { label: "Germany", value: 120, partial: 64 }, // 53% realized
    { label: "United States", value: 152, partial: 88 },
    { label: "China", value: 168, partial: 51 },
  ],
};
```

## Gravity & the split

`gravity` sets how strongly bubbles are pulled toward the centre (higher = tighter), `padding` the gap between them, and `fillRatio` how much of the plot the cloud fills. The split mirrors the treemap: `partial` carves an area-true realized core (radius `r·√(partial/value)`), and the rest reads as a lighter tint of the same hue - a solid colour under a white veil, so it works on light **and** dark backgrounds. Name the parts with `splitLabels`.

## API

Props are typed as `BubbleChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context). Full reference: [Bubble API](/api/bubble).
