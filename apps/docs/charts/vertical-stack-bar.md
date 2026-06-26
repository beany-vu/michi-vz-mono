---
title: Vertical Stack Bar
---
# Vertical Stack Bar

<span class="vp-badge tip">Composition</span>

Stacked vertical bars per category, with an explicit missing-data marker guard for sparse datasets.

<ChartDemo chart="vertical-stack-bar-chart" />

## Usage

::: code-group

```tsx [React]
import { VerticalStackBarChart } from "@michi-vz/react";

<VerticalStackBarChart dataSet={data} renderer="svg" />;
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-vertical-stack-bar-chart id="c"></michi-vz-vertical-stack-bar-chart>
<script>
  document.getElementById("c").dataSet = data;
</script>
```

```ts [Engine]
import { mountVerticalStackBarChart } from "@michi-vz/core";

const chart = mountVerticalStackBarChart(el, { dataSet: data });
chart.getContext(); // renderer-agnostic, LLM-ready
```

:::

## API

Props are typed as `VerticalStackBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/tree/main/packages/core/src/types.ts). Every chart shares `width`, `height`, `margin`, `colors`/`colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks; `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
