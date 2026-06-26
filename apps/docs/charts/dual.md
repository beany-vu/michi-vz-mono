---
title: Dual Horizontal Bar (Tornado)
---
# Dual Horizontal Bar (Tornado)

<span class="vp-badge tip">Comparison</span>

Diverging bars from a centre line — value1 right, value2 left (population pyramids, tornado charts).

<ChartDemo chart="dual-horizontal-bar-chart" />

## Usage

::: code-group

```tsx [React]
import { DualHorizontalBarChart } from "@michi-vz/react";

<DualHorizontalBarChart dataSet={data} renderer="svg" />;
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-dual-horizontal-bar-chart id="c"></michi-vz-dual-horizontal-bar-chart>
<script>
  document.getElementById("c").dataSet = data;
</script>
```

```ts [Engine]
import { mountDualHorizontalBarChart } from "@michi-vz/core";

const chart = mountDualHorizontalBarChart(el, { dataSet: data });
chart.getContext(); // renderer-agnostic, LLM-ready
```

:::

## API

Props are typed as `DualHorizontalBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/tree/main/packages/core/src/types.ts). Every chart shares `width`, `height`, `margin`, `colors`/`colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks; `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
