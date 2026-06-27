---
title: Line Chart API
---

# Line Chart API

Everything you need to wire up a line chart in code; for the story and live demos, see the **[Line Chart demo](/charts/line)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/line-chart";
// <michi-vz-line-chart> is now defined
```

```ts [Vanilla JS]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, props);
```

:::

## Props

<PropsTable chart="line-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountLineChart(el, props).getContext()` returns a renderer-agnostic **`LineChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`LineChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
