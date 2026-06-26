---
title: Ribbon Chart
---
# Ribbon Chart

<span class="vp-badge tip">Composition</span>

Stacked columns per period, linked by connector ribbons that trace each category across time.

<ChartDemo chart="ribbon-chart" />

## Usage

::: code-group

```tsx [React]
import { RibbonChart } from "@michi-vz/react";

<RibbonChart dataSet={data} renderer="svg" />;
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
<script>
  document.getElementById("c").dataSet = data;
</script>
```

```ts [Engine]
import { mountRibbonChart } from "@michi-vz/core";

const chart = mountRibbonChart(el, { dataSet: data });
chart.getContext(); // renderer-agnostic, LLM-ready
```

:::

## API

Props are typed as `RibbonChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/tree/main/packages/core/src/types.ts). Every chart shares `width`, `height`, `margin`, `colors`/`colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks; `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
