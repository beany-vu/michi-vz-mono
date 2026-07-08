---
title: Bubble Chart
description: "Bubble chart with area-true sizing and a gravity layout; each bubble can split into a realized core and an untapped ring, showing size and progress together."
---
# Bubble Chart

<span class="vp-badge tip">Composition</span>

"How big is each one, and how much of it is already realized?" A bubble cloud answers magnitude at a glance: every circle is sized by value (**area**, not radius), and a gravity simulation pulls them into a tidy cluster so the big ones obviously dominate. Like the [treemap](/charts/treemap), each bubble can carry a **two-part split** - a solid realized core inside a lighter untapped ring - so you read size and progress together.

<ChartDemo chart="bubble-chart" :legend="[]" />

No split needed? Drop `partial` for a clean proportional cloud, one colour per category:

<ChartDemo chart="bubble-chart" :index="1" :legend="[]" />

> The cluster is laid out with [d3-force](https://github.com/d3/d3-force): bubbles fall toward the centre (`gravity`) and push apart so they never overlap (collision). The simulation is settled **synchronously**, so SVG and canvas render the identical, reproducible layout.

## When to reach for it

- **Magnitude at a glance.** Products, markets, keywords as a sized cloud - when "which ones are big?" matters more than an exact ranking, the cluster answers instantly.
- **Opportunity maps.** With the split, a big bubble with a thin realized core is money on the table - the scan-for-upside view for portfolio reviews.
- **If position should mean something** (two numeric axes, correlation), that is a [Scatter plot](/charts/scatter); the bubble cloud trades position for compactness.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
// Another nod to CERN: one simulated collision event's worth of reconstructed
// energy clusters, one bubble per cluster, area = energy. A falling power-law
// spectrum means a few big deposits over thousands of soft ones - the gravity
// packing turns the event's whole energy budget into one readable cloud.
function makeBubble() {
  const subdetectors = [
    { label: "Tracker", color: "#457b9d", share: 0.38 },
    { label: "ECAL", color: "#2a9d8f", share: 0.3 },
    { label: "HCAL", color: "#e07b39", share: 0.24 },
    { label: "Muon chambers", color: "#9b5de5", share: 0.08 },
  ];
  const dataSet = [];
  let i = 0;
  for (const s of subdetectors) {
    const n = Math.round(1500 * s.share);
    for (let k = 0; k < n; k++) {
      dataSet.push({
        label: `${s.label} #${i++}`,
        // Falling energy spectrum: many soft clusters, a handful of hard ones.
        value: 2 + 200 * Math.pow(Math.random(), 3),
        color: s.color,
      });
    }
  }
  return {
    title: "One simulated collision event: energy clusters, bubble area = energy (GeV)",
    dataSet, gravity: 0.06, padding: 0.5,
    // Chunked async settle + fewer ticks: the multi-second force layout runs in
    // ~12ms slices behind the chart's loading overlay instead of freezing the page.
    layoutMode: "async", settleTicks: 200,
  };
}
</script>

BubbleChart has an opt-in `renderer="webgpu"` that paints the bubble cloud as GPU-instanced circles while labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

Like the scatter page, the demo below borrows from particle physics: ~1,500 reconstructed energy clusters from one simulated collision event, one bubble per cluster, coloured by subdetector. The handful of hard deposits tower over thousands of soft ones, and gravity packing turns the whole event's energy budget into a single readable cloud.

<WebgpuHeavyDemo element="michi-vz-bubble-chart" :make="makeBubble" :legend="[
    { label: 'Tracker', color: '#457b9d' },
    { label: 'ECAL', color: '#2a9d8f' },
    { label: 'HCAL', color: '#e07b39' },
    { label: 'Muon chambers', color: '#9b5de5' },
  ]" caption="~1,500 simulated energy clusters" />

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

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
