---
title: Comparable Horizontal Bar
---
# Comparable Horizontal Bar

<span class="vp-badge tip">Comparison</span>

Two overlaid horizontal sub-bars per label — a “based” vs “compared” value.

<ChartDemo chart="comparable-horizontal-bar-chart" />

## Usage

::: code-group

```tsx [React]
import { ComparableHorizontalBarChart } from "@michi-vz/react";

<ComparableHorizontalBarChart dataSet={data} renderer="svg" />;
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-comparable-horizontal-bar-chart id="c"></michi-vz-comparable-horizontal-bar-chart>
<script>
  document.getElementById("c").dataSet = data;
</script>
```

```ts [Engine]
import { mountComparableHorizontalBarChart } from "@michi-vz/core";

const chart = mountComparableHorizontalBarChart(el, { dataSet: data });
chart.getContext(); // renderer-agnostic, LLM-ready
```

:::

## API

Props are typed as `ComparableHorizontalBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/tree/main/packages/core/src/types.ts). Every chart shares `width`, `height`, `margin`, `colors`/`colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks; `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
