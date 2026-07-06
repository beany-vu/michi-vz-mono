---
title: Comparable Vertical Bar
description: "Comparable vertical bar chart: two full-bandwidth overlapping columns per category - a based value behind, a compared value in front - with a change arrow above each pair. The vertical migration target for legacy sdg-trade BarchartVertical."
---
# Comparable Vertical Bar

<span class="vp-badge tip">Comparison</span>

Did it get better or worse, category by category? Each column overlays two full-width bars - the reference value behind, the current value in front - with a change arrow + label reading the shift at a glance.

<ChartDemo
  chart="comparable-vertical-bar-chart"
  :legend="[
    { label: '2019 (based, pale tint, behind)', color: '#b1b1b1' },
    { label: '2024 (compared, solid, in front)', color: '#6e6e6e' },
  ]"
/>

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeComparableVertical() {
  const colors = ["#c0392b", "#2c6fbb", "#1f1f1f", "#e07b39", "#2e8b57", "#8e44ad", "#16a085"];
  const dataSet = [];
  for (let i = 0; i < 60; i++) {
    const base = 50 + Math.round(Math.random() * 950);
    const compared = Math.max(1, Math.round(base * (0.6 + Math.random() * 0.8)));
    dataSet.push({
      label: `Sector ${i + 1}`,
      valueBased: base,
      valueCompared: compared,
      color: colors[i % colors.length],
    });
  }
  return { title: "Sector export value: 2019 vs 2024, US$ bn (synthetic)", dataSet };
}
</script>

ComparableVerticalBarChart has an opt-in `renderer="webgpu"` that paints the two sub-bars per column as GPU-instanced rectangles while axes, labels, and the delta indicator stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-comparable-vertical-bar-chart" :make="makeComparableVertical" caption="~60 columns" />

## Usage

::: code-group

```tsx [React]
import { ComparableVerticalBarChart } from "@michi-vz/react";

export default () => <ComparableVerticalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ComparableVerticalBarChart } from "@michi-vz/vue";
</script>

<template>
  <ComparableVerticalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { comparableVerticalBarChart } from "@michi-vz/svelte";
</script>

<div use:comparableVerticalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyComparableVerticalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-comparable-vertical-bar-chart #c></michi-vz-comparable-vertical-bar-chart>
applyComparableVerticalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-comparable-vertical-bar-chart id="c"></michi-vz-comparable-vertical-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountComparableVerticalBarChart } from "@michi-vz/core";

const chart = mountComparableVerticalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `ComparableVerticalBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).

## Behaviour notes

### Two full-bandwidth sub-bars per column, FIXED z-order

Each category draws `valueBased` (the reference/prior value, rear, hatch-eligible) and `valueCompared` (the current/latest value, front, solid), both at the **same x and the full column bandwidth** - unlike ComparableHorizontalBarChart's optional "grouped" half-band layout, this chart is overlay-only. The z-order is **fixed** (not width-dependent): `valueBased` is always painted behind, `valueCompared` always in front - ported from legacy sdg-trade `BarchartVertical`'s `BarCompare`/`Bar` paint order. `colorsBasedMapping` gives the value-based sub-bar its own colour per label: pair an opaque light tint with `valueBasedOpacity: 1` for the crispest before/after contrast in both themes. `valueBasedOpacity` / `valueComparedOpacity` set their fill opacity (historical look: 0.45 / 0.9). A sub-bar whose resolved fill is `transparent` is **skipped** (consumers hide one half via CSS). `minBarHeight` (default 5) floors a non-zero bar so near-zero values stay visible.

### Delta indicator - and this chart's context reflects it

`deltaIndicator: { show: true }` draws a change arrow + formatted label ABOVE the taller of the two sub-bars (legacy `translate(bandwidth/3, -32)` placement). Unlike ComparableHorizontalBarChart (whose indicator is presentational-only), **this chart's `getContext()` reflects the indicator**: each `series[]` row carries `deltaDirection` / `deltaColor` / `deltaLabel` when active, `stats.improved` / `stats.worsened` counts the good/bad movers, and the a11y table gains a fifth "Change" column. `positiveIsGood` / `positiveIsUp` pick the color/direction mapping (see the `DeltaIndicatorConfig` JSDoc for the full decision table); `formatter(diff, datum)` takes full control of the label text. Omitted, or `{ show: false }`, is a provable no-op - zero geometry, zero `.mv-delta` DOM, zero extra context fields.

### `patternsMapping` - hatch / image fills

`patternsMapping: Record<label, imageSrc>` fills the **value-based** sub-bar with a tiled image instead of a flat colour. `createHatchPattern({ color, angle?, spacing?, strokeWidth? })` (exported from `@michi-vz/core` and `@michi-vz/react`) returns a diagonal-hatch SVG data-URI for the common case. The SVG renderer references it from a real `<defs><pattern>` def; the canvas renderer tiles it via `ctx.createPattern` and re-renders once the image loads.

### Value axis (y)

`yAxisDomain: [min, max]` fixes the value-axis range. `symmetricYDomain` forces `[-M, M]` (M = the largest absolute value) so zero sits centred. `showZeroLineForYAxis` draws a solid line at y=0 (diverging charts); `showGrid` toggles horizontal gridlines (default off). `yAxisFormat` formats the tick labels; `ticks` sets the approximate tick count.

### Category axis (x)

Column labels fit horizontally when there's room; otherwise they tilt -45° (or thin to a readable subset with `xAxisMode: "horizontal"`), the same `chooseAxisMode` layout VerticalStackBarChart uses. `xAxisLabelPadding` raises the bar before a label rotates; `xAxisFormat` formats each label; `hideTickLabels` hides them entirely; `maxBarWidth` caps each column's thickness (and centres the plot) so a handful of categories don't balloon into giant blocks.

### Tooltip

`tooltipFormatter(datum, dataSet, type)` receives the hovered column, all columns, and the hovered **sub-bar** `type` (`"based" | "compared"`). It returns an HTML string; the React wrapper additionally accepts a React node (converted to static HTML). The built-in tooltip is edge-aware (flips near the right/bottom edges).

### Loading / no-data + interaction

`isLoading` and `isNodata` drive the overlay (React: `isLoadingComponent` / `isNodataComponent`). Hovering highlights a column (others dim) and `mouseleave` clears it; the bars are rounded (radius 5) with a 1px border.

> **Consumer colour authorities:** the context carries `legendData` (`{ label, color, dataLabelSafe }`) so a CSS-injection colour system can key per-label rules; `onChartDataProcessed` is only emitted when the context **changes** (re-emitting an unchanged context every render can loop a consumer that dispatches on each call).
