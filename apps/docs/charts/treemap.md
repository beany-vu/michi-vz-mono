---
title: Treemap
---
# Treemap

<span class="vp-badge tip">Composition</span>

"Which parts are biggest, and how much of each is already realized?" A treemap answers both at once: every tile is sized by its total, and an optional **two-part split** fills the solid share inside each tile - so you read magnitude (area) and progress (the split) in one glance. The classic case is export potential: tile area = total potential, the solid part = **realized**, the lighter part = **untapped**. Tiles can nest under groups, and on a narrow screen the whole thing folds into a readable single-column **stack**.

<ChartDemo chart="treemap-chart" />

Prefer a flat list (one tile per product, each its own colour - the classic export-potential layout)? Drop the `children` nesting and pass leaves directly:

<ChartDemo chart="treemap-chart" :index="1" />

> The split is generic. Name the two parts with `splitLabels` - `["Realized", "Untapped"]`, `["Used", "Free"]`, `["Done", "Remaining"]` - nothing in the engine hardcodes a domain.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeTreemap() {
  const sectors = [
    { label: "Industry", color: "#1d3557" },
    { label: "Agri-food", color: "#e9c46a" },
    { label: "Materials", color: "#2a9d8f" },
    { label: "Textiles", color: "#e63946" },
    { label: "Pharmaceuticals", color: "#457b9d" },
    { label: "Energy", color: "#f4a261" },
    { label: "Electronics", color: "#9b5de5" },
    { label: "Services", color: "#06d6a0" },
  ];
  const dataSet = sectors.map((sector, si) => {
    const children = [];
    for (let i = 0; i < 50; i++) {
      const value = 5 + Math.round(Math.random() * 120);
      const partial = Math.round(Math.random() * value);
      children.push({
        label: `${sector.label} product ${si * 50 + i + 1}`,
        value,
        partial,
      });
    }
    return { label: sector.label, color: sector.color, children };
  });
  return { splitLabels: ["Realized", "Untapped"], showLegend: true, layout: "squarify", dataSet };
}
</script>

TreemapChart has an opt-in `renderer="webgpu"` that paints the tiles as GPU-instanced rectangles while labels, tooltips and the split fill stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-treemap-chart" :make="makeTreemap" caption="~400 tiles" />

## Usage

::: code-group

```tsx [React]
import { TreemapChart } from "@michi-vz/react";

export default () => <TreemapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { TreemapChart } from "@michi-vz/vue";
</script>

<template>
  <TreemapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { treemapChart } from "@michi-vz/svelte";
</script>

<div use:treemapChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyTreemapChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-treemap-chart #c></michi-vz-treemap-chart>
applyTreemapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-treemap-chart id="c"></michi-vz-treemap-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, splitLabels, …
</script>
```

```ts [Vanilla JS]
import { mountTreemapChart } from "@michi-vz/core";

const chart = mountTreemapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Data shape

Each `dataSet` node is a leaf (`value`, optional `partial`) or a parent (`children`). A parent's value is the sum of its leaves.

```ts
const props = {
  splitLabels: ["Realized", "Untapped"],
  showLegend: true,
  layout: "auto", // squarify on desktop, stack on narrow screens
  dataSet: [
    { label: "Agri-food", children: [
      { label: "Fruits", value: 100, partial: 34 },   // 34% realized
      { label: "Beverages", value: 50, partial: 35 }, // 70% realized
    ]},
    { label: "Industry", children: [
      { label: "Machinery", value: 120, partial: 64 },
    ]},
  ],
};
```

## Responsive layout

`layout` picks the tiling algorithm: `"squarify"` (the treemap), `"stack"` (a single-column vertical partition - full-width rows, height proportional to value, with the same in-row split), or `"auto"` (switches to stack below `stackBreakpoint`, default 480px). The split, labels, tooltip, `getContext()` and SVG/canvas parity are identical across both layouts.

## API

Props are typed as `TreemapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context). Full reference: [Treemap API](/api/treemap).
