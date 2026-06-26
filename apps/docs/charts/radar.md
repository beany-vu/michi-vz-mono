---
title: Radar Chart
---
# Radar Chart

<span class="vp-badge tip">Comparison</span>

Compare several entities across a shared set of axes at a glance (a polygon per entity).

<ChartDemo chart="radar-chart" />

## Usage

::: code-group

```tsx [React]
import { RadarChart } from "@michi-vz/react";

<RadarChart dataSet={data} renderer="svg" />;
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
<script>
  document.getElementById("c").dataSet = data;
</script>
```

```ts [Engine]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, { dataSet: data });
chart.getContext(); // renderer-agnostic, LLM-ready
```

:::

## API

Props are typed as `RadarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/tree/main/packages/core/src/types.ts). Every chart shares `width`, `height`, `margin`, `colors`/`colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks; `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
