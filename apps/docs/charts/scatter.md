---
title: Scatter Plot
---
# Scatter Plot

<span class="vp-badge tip">Correlation</span>

Relationship between two numeric variables; bubble size encodes a third. Pearson correlation is surfaced in getContext().

<ChartDemo chart="scatter-chart" />

## Usage

::: code-group

```tsx [React]
import { ScatterChart } from "@michi-vz/react";

<ScatterChart dataSet={data} renderer="svg" />;
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-scatter-chart id="c"></michi-vz-scatter-chart>
<script>
  document.getElementById("c").dataSet = data;
</script>
```

```ts [Engine]
import { mountScatterChart } from "@michi-vz/core";

const chart = mountScatterChart(el, { dataSet: data });
chart.getContext(); // renderer-agnostic, LLM-ready
```

:::

## API

Props are typed as `ScatterChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/tree/main/packages/core/src/types.ts). Every chart shares `width`, `height`, `margin`, `colors`/`colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks; `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
