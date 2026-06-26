---
title: Area Chart
---
# Area Chart

<span class="vp-badge tip">Composition</span>

Part-to-whole over time: how each component’s share of a stacked total shifts.

<ChartDemo chart="area-chart" />

## Usage

::: code-group

```tsx [React]
import { AreaChart } from "@michi-vz/react";

<AreaChart dataSet={data} renderer="svg" />;
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-area-chart id="c"></michi-vz-area-chart>
<script>
  document.getElementById("c").dataSet = data;
</script>
```

```ts [Engine]
import { mountAreaChart } from "@michi-vz/core";

const chart = mountAreaChart(el, { dataSet: data });
chart.getContext(); // renderer-agnostic, LLM-ready
```

:::

## API

Props are typed as `AreaChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/tree/main/packages/core/src/types.ts). Every chart shares `width`, `height`, `margin`, `colors`/`colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks; `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
