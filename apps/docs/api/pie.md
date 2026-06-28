---
title: Pie / Donut API
---

# Pie / Donut API

Slices sized by share of a whole, with a donut mode one prop away (`innerRadiusRatio`) - see the **[Pie / Donut demo](/charts/pie)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/pie-chart";
// <michi-vz-pie-chart> is now defined
```

```ts [Vanilla JS]
import { mountPieChart } from "@michi-vz/core";

const chart = mountPieChart(el, props);
```

:::

## Props

<PropsTable chart="pie-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountPieChart(el, props).getContext()` returns a renderer-agnostic **`PieChartContext`**: the `mode` (`"pie"` or `"donut"`), `innerRadiusRatio`, the `slices` (label / value / share / start & end angle), summary stats (slice count, total, largest slice), a deterministic natural-language summary, and an a11y table. See [LLM context](/guide/llm-context).

## Source

Props are typed as [`PieChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
