---
title: Vertical Stack Bar
description: "Vertical stacked bar chart for composition across categories, with an explicit guard that marks missing segments instead of flattening them to zero."
---
# Vertical Stack Bar

<span class="vp-badge tip">Composition</span>

"What's each category made of, and how does the mix shift across them?" Stack the parts in one bar per category and the composition reads at a glance. When a segment is missing, an explicit guard marks the gap instead of quietly flattening it to zero.

<ChartDemo chart="vertical-stack-bar-chart" />

Need to compare two things side by side? Pass **more than one series** in `dataSet` and the bars **group**: per x-category you get one stacked bar per series, clustered together. Here, two regions across three years, each bar split into five product lines - so you read which region is bigger *and* how its mix differs, at once:

<ChartDemo chart="vertical-stack-bar-chart" :index="1" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeVsb() {
  const keys = ["Cloud", "Hardware", "Licenses", "Services", "Support"];
  const base = { Cloud: 40, Hardware: 60, Licenses: 50, Services: 30, Support: 20 };
  const drift = { Cloud: 3.2, Hardware: -0.4, Licenses: 0.6, Services: 1.8, Support: 0.3 };
  const series = [];
  for (let i = 0; i < 150; i++) {
    const row = { date: String(2000 + i) };
    for (const k of keys) {
      const noise = (Math.random() - 0.5) * 8;
      row[k] = Math.max(1, base[k] + drift[k] * i * 0.1 + noise);
    }
    series.push(row);
  }
  const dataSet = [
    {
      seriesKey: "Global",
      seriesKeyAbbreviation: "GLB",
      series,
    },
  ];
  return { dataSet, keys, keysOrder: "bottomToTop" };
}
</script>

VerticalStackBarChart has an opt-in `renderer="webgpu"` that paints its bars on the GPU while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo legend element="michi-vz-vertical-stack-bar-chart" :make="makeVsb" caption="~150 bars × 5 keys" />

## Usage

::: code-group

```tsx [React]
import { VerticalStackBarChart } from "@michi-vz/react";

export default () => <VerticalStackBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { VerticalStackBarChart } from "@michi-vz/vue";
</script>

<template>
  <VerticalStackBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { verticalStackBarChart } from "@michi-vz/svelte";
</script>

<div use:verticalStackBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyVerticalStackBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-vertical-stack-bar-chart #c></michi-vz-vertical-stack-bar-chart>
applyVerticalStackBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-vertical-stack-bar-chart id="c"></michi-vz-vertical-stack-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountVerticalStackBarChart } from "@michi-vz/core";

const chart = mountVerticalStackBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `VerticalStackBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).

## Behaviour notes

These behaviours are automatic (no extra wiring) and match the legacy `michi-vz` chart for drop-in parity.

### Dense x-axis - auto rotate / thin

The band axis measures its labels and adapts: **horizontal** when they fit, **rotated −45°** (all labels still shown) when they don't, and **thinned** to an evenly-spaced subset only at extreme density. The bottom margin is reserved automatically so rotated labels never clip. No prop needed - pass `xAxisFormat` to format the tick text (e.g. `202401` → `01-2024`).

### `date` accepts numbers

A row's `date` may be a `number` (e.g. `date: 2024`) or a string; the engine `String()`-coerces it. The band scale is `scaleBand<string>`, so mixed types are normalised consistently.

### `keysOrder` and colour order

`keysOrder` (`"topToBottom"` default | `"bottomToTop"`) chooses which end of the stack `keys[0]` sits at. With `"bottomToTop"` the **legend / colour order is reversed** relative to the stack draw order - a consumer colour authority that assigns colours by appearance order in `legendData` therefore binds slot 0 to the *top* key, not the bottom one. The stack draw (pixel) order is decided independently and is unaffected.

### `filter` - Top/Bottom-N groups

`filter = { limit, sortingDir }` ranks the **DataSets** (groups) by their grand total across all rows + keys and keeps the top (`"desc"`) or bottom (`"asc"`) `limit`. Everything downstream (keys, dates, y-domain, bars and legend) derives from the filtered set, so the legend always mirrors exactly the drawn bars.

### `disabledItems`

Names in `disabledItems` drop matching **segment keys** *and* **DataSet groups**. Disabling a group makes the remaining bars **widen** to split the band between the visible groups.

### `tooltipFormatter`

Receives `{ item, key, seriesKey, series, isMissing }` - `item` is the full data row, `key` the hovered segment, `series` the hovered segment's rows across dates. The built-in tooltip is **edge-aware**: it flips to the left of the cursor near the right edge and drops below the cursor near the top, so it never spills off-screen.

### Interaction (canvas)

Hovering a segment dims the others **same-frame** (no input lag); leaving the chart clears the dim. **Click** a bar to pin the tooltip, click it again to re-pin, and click outside the chart to unpin.
