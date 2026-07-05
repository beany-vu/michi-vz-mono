---
title: Comparable Horizontal Bar
description: "Comparable bar chart: before and after side by side on one bar per label, so the gap that closed or opened is the first thing readers see."
---
# Comparable Horizontal Bar

<span class="vp-badge tip">Comparison</span>

Did it get better or worse? Put before and after side by side on one bar per label, and the gap that closed (or opened) is the first thing the reader sees.

<ChartDemo
  chart="comparable-horizontal-bar-chart"
  :legend="[
    { label: '2019 (before, pale tint)', color: '#b1b1b1' },
    { label: '2024 (after, solid)', color: '#6e6e6e' },
  ]"
/>

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeComparable() {
  const colors = ["#c0392b", "#2c6fbb", "#1f1f1f", "#e07b39", "#2e8b57", "#8e44ad", "#16a085"];
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const base = 50 + Math.round(Math.random() * 2950);
    const compared = Math.max(1, Math.round(base * (0.6 + Math.random() * 0.8)));
    dataSet.push({
      label: `Region ${i + 1}`,
      valueBased: base,
      valueCompared: compared,
      color: colors[i % colors.length],
    });
  }
  return { title: "Merchandise exports: 2019 vs 2024, US$ bn (synthetic)", dataSet };
}
</script>

ComparableHorizontalBarChart has an opt-in `renderer="webgpu"` that paints the two sub-bars per row as GPU-instanced rectangles while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-comparable-horizontal-bar-chart" :make="makeComparable" caption="~120 rows" />

## Usage

::: code-group

```tsx [React]
import { ComparableHorizontalBarChart } from "@michi-vz/react";

export default () => <ComparableHorizontalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ComparableHorizontalBarChart } from "@michi-vz/vue";
</script>

<template>
  <ComparableHorizontalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { comparableHorizontalBarChart } from "@michi-vz/svelte";
</script>

<div use:comparableHorizontalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyComparableHorizontalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-comparable-horizontal-bar-chart #c></michi-vz-comparable-horizontal-bar-chart>
applyComparableHorizontalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-comparable-horizontal-bar-chart id="c"></michi-vz-comparable-horizontal-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountComparableHorizontalBarChart } from "@michi-vz/core";

const chart = mountComparableHorizontalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `ComparableHorizontalBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).

## Behaviour notes

### Two sub-bars per row

Each row draws `valueBased` (pale) and `valueCompared` (solid), diverging from x=0; the shorter sub-bar is drawn on top so both stay visible whichever way the value moved. `colorsBasedMapping` gives the value-based sub-bar its own colour per label: pair an opaque light tint with `valueBasedOpacity: 1` (as the demo above does) for the crispest before/after contrast in both themes. `valueBasedOpacity` / `valueComparedOpacity` set their fill opacity. A sub-bar whose resolved fill is `transparent` is **skipped** (consumers hide one half via CSS). `minBarWidth` (default 5) floors a non-zero bar so near-zero values stay visible.

### `patternsMapping` - hatch / image fills

`patternsMapping: Record<label, imageSrc>` fills the **value-based** sub-bar with a tiled image instead of a flat colour. `createHatchPattern({ color, angle?, spacing?, strokeWidth? })` (exported from `@michi-vz/core` and `@michi-vz/react`) returns a diagonal-hatch SVG data-URI for the common case. The canvas renderer tiles it via `ctx.createPattern` and re-renders once the image loads.

### Value axis (x)

`xAxisPredefinedDomain: [min, max]` fixes the value-axis range (alias of `xAxisDomain`). `showZeroLineForXAxis` draws a solid line at x=0 (diverging charts); `showGrid` toggles vertical gridlines (default off). `xAxisFormat` formats the tick labels.

### Label column (y)

The y-axis category labels live in a left column `tickHtmlWidth` px wide (default 100, ellipsised). `padding.left` insets the **plot** (bars + value axis) to the right WITHOUT moving the labels - opening room for a wide label column. `horizontalTickPosition: { x, y }` nudges the labels to align with an external legend. `hideTickLabels` hides them entirely (when the category names live in a legend instead).

### Tooltip

`tooltipFormatter(datum, dataSet, type)` receives the hovered row, all rows, and the hovered **sub-bar** `type` (`"based" | "compared"`). It returns an HTML string; the React wrapper additionally accepts a React node (converted to static HTML). The built-in tooltip is edge-aware (flips near the right/top edges).

### Loading / no-data + interaction

`isLoading` and `isNodata` drive the overlay (React: `isLoadingComponent` / `isNodataComponent`). Hovering highlights a row (others dim) and `mouseleave` clears it; the bars are rounded (radius 5) with a 1px border.

> **Consumer colour authorities:** the context carries `legendData` (`{ label, color, dataLabelSafe }`) so a CSS-injection colour system can key per-label rules; `onChartDataProcessed` is only emitted when the context **changes** (re-emitting an unchanged context every render can loop a consumer that dispatches on each call).
