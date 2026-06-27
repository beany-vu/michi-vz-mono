---
title: Range Chart API
---

# Range Chart API

Shade the spread, not a single line - the API for min-max bands and forecast cones. See the **[Range Chart demo](/charts/range)** for examples and usage.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/range-chart";
// <michi-vz-range-chart> is now defined
```

```ts [Vanilla JS]
import { mountRangeChart } from "@michi-vz/core";

const chart = mountRangeChart(el, props);
```

:::

## Props

<PropsTable chart="range-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountRangeChart(el, props).getContext()` returns a renderer-agnostic **`RangeChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`RangeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
