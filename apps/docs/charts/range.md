---
title: Range Chart
---
# Range Chart

<span class="vp-badge tip">Uncertainty</span>

Min–max bands per series — forecasts, confidence intervals, or observed ranges over time.

<ChartDemo chart="range-chart" />

## Usage

::: code-group

```tsx [React]
import { RangeChart } from "@michi-vz/react";

<RangeChart dataSet={data} renderer="svg" />;
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-range-chart id="c"></michi-vz-range-chart>
<script>
  document.getElementById("c").dataSet = data;
</script>
```

```ts [Engine]
import { mountRangeChart } from "@michi-vz/core";

const chart = mountRangeChart(el, { dataSet: data });
chart.getContext(); // renderer-agnostic, LLM-ready
```

:::

## API

Props are typed as `RangeChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/tree/main/packages/core/src/types.ts). Every chart shares `width`, `height`, `margin`, `colors`/`colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks; `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
