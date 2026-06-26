---
title: Line Chart
---
# Line Chart

<span class="vp-badge tip">Trends</span>

Trends over time across one or many series — with optional gap detection, an opt-in canvas renderer (LTTB-decimated for big data), and single-point guide lines.

<ChartDemo chart="line-chart" />

## Usage

::: code-group

```tsx [React]
import { LineChart } from "@michi-vz/react";

<LineChart dataSet={data} renderer="svg" />;
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-line-chart id="c"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = data;
</script>
```

```ts [Engine]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, { dataSet: data });
chart.getContext(); // renderer-agnostic, LLM-ready
```

:::

## API

Props are typed as `LineChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/tree/main/packages/core/src/types.ts). Every chart shares `width`, `height`, `margin`, `colors`/`colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks; `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
