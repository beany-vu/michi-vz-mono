---
title: Bar-Bell
---
# Bar-Bell

<span class="vp-badge tip">Composition</span>

Cumulative horizontal segments per row with end-cap circles marking each step.

<ChartDemo chart="bar-bell-chart" />

## Usage

::: code-group

```tsx [React]
import { BarBellChart } from "@michi-vz/react";

<BarBellChart dataSet={data} renderer="svg" />;
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
<script>
  document.getElementById("c").dataSet = data;
</script>
```

```ts [Engine]
import { mountBarBellChart } from "@michi-vz/core";

const chart = mountBarBellChart(el, { dataSet: data });
chart.getContext(); // renderer-agnostic, LLM-ready
```

:::

## API

Props are typed as `BarBellChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/tree/main/packages/core/src/types.ts). Every chart shares `width`, `height`, `margin`, `colors`/`colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks; `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
