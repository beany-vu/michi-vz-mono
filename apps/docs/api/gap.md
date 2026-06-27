---
title: Gap Chart API
---

# Gap Chart API

Show the distance between two numbers and let the bar carry the punch - see the **[Gap Chart demo](/charts/gap)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/gap-chart";
// <michi-vz-gap-chart> is now defined
```

```ts [Vanilla JS]
import { mountGapChart } from "@michi-vz/core";

const chart = mountGapChart(el, props);
```

:::

## Props

<PropsTable chart="gap-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountGapChart(el, props).getContext()` returns a renderer-agnostic **`GapChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`GapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
