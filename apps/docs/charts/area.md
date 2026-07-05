---
title: Area Chart
description: "Stacked area chart for composition over time: watch each category's share of the whole expand or shrink while the total rises."
---
# Area Chart

<span class="vp-badge tip">Composition</span>

The total is growing, but which slice is driving it? Stack your categories and watch each one's share of the whole expand or shrink across time, so a rising tide and a shifting mix tell their stories at once.

<ChartDemo chart="area-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **Composition over time when the total matters too.** The stacked bands show each category's share while the top edge traces the sum - a rising tide and a shifting mix in one picture.
- **"The mix is changing" stories.** A slice that thins while the total grows is a message no spreadsheet delivers as fast - ideal for revenue-by-product or traffic-by-channel reviews.
- **When ranks reshuffle, switch charts.** If the story is who overtook whom, the [Ribbon chart](/charts/ribbon) makes the swaps explicit; for a single moment in time, a [Pie](/charts/pie) is enough.

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

function makeNoDataArea() {
  const keys = ["Raw", "Semi-processed", "Processed"];
  // 24 months, but 2022-04/05/09 and 2023-02/03 are MISSING from the data.
  const present = [
    "2022-01", "2022-02", "2022-03", "2022-06", "2022-07", "2022-08",
    "2022-10", "2022-11", "2022-12", "2023-01", "2023-04", "2023-05",
    "2023-06", "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  ];
  const series = present.map((date, i) => ({
    date,
    Raw: 20 + Math.round(Math.sin(i / 3) * 8),
    "Semi-processed": 30 + Math.round(Math.cos(i / 2) * 6),
    Processed: 50 + Math.round(Math.sin(i / 4) * 5),
  }));
  return {
    series,
    keys,
    xAxisDataType: "date_monthly",
    colorsMapping: { Raw: "#2c6fbb", "Semi-processed": "#e07b39", Processed: "#3aa757" },
    xAxisFormat: (d) => {
      const dt = new Date(Number(d));
      return (
        dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) +
        " " +
        String(dt.getUTCFullYear()).slice(2)
      );
    },
    noDataTickTooltip: () => "No data reported for this month",
  };
}
</script>

AreaChart has an opt-in `renderer="webgpu"` that paints the stacked bands on the GPU while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically.

<WebgpuHeavyDemo legend element="michi-vz-area-chart" :make="makeArea" caption="~7,500 points" />

## Continuous timeline & no-data ticks

The x-axis always keeps the **first and last period** and tilts / thins crowded labels to ~5. Opt into `fillPeriodTicks` to draw a tick for **every** month in range; months with no data render **faded** with a "no data" hover tooltip. Toggle it:

<NoDataTicksDemo element="michi-vz-area-chart" :make="makeNoDataArea" />

Customize via `noDataTickTooltip(epochMs)` (tooltip text) and `noDataTickColor` (or the `--michi-vz-tick-nodata` CSS var).

::: code-group

```tsx [React]
<AreaChart
  {...props}
  xAxisDataType="date_monthly"
  fillPeriodTicks
  noDataTickTooltip={() => "No data reported for this month"}
  noDataTickColor="#c0392b"
/>
```

```vue [Vue]
<AreaChart :options="{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }" />
```

```svelte [Svelte]
<div use:areaChart={{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }}></div>
```

```ts [Angular]
applyAreaChartProps(this.c.nativeElement, {
  ...props,
  fillPeriodTicks: true,
  noDataTickTooltip: () => "No data",
});
```

```html [Web component]
<michi-vz-area-chart id="c" fill-period-ticks no-data-tick-color="#c0392b"></michi-vz-area-chart>
<script>
  document.getElementById("c").noDataTickTooltip = () => "No data reported";
</script>
```

:::

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
