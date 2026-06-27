---
title: Scatter Plot API
---

# Scatter Plot API

Reach for this when the question is "are these two numbers related?" - the props and engine below; the live answer is on the **[Scatter Plot demo](/charts/scatter)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/scatter-chart";
// <michi-vz-scatter-chart> is now defined
```

```ts [Vanilla JS]
import { mountScatterChart } from "@michi-vz/core";

const chart = mountScatterChart(el, props);
```

:::

## Props

<PropsTable chart="scatter-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountScatterChart(el, props).getContext()` returns a renderer-agnostic **`ScatterChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`ScatterChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
