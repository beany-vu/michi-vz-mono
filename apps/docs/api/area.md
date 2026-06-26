---
title: Area Chart API
---

# Area Chart API

The `<michi-vz-area-chart>` element and the `mountAreaChart` engine. For examples and usage, see the **[Area Chart demo](/charts/area)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/area-chart";
// <michi-vz-area-chart> is now defined
```

```ts [Vanilla JS]
import { mountAreaChart } from "@michi-vz/core";

const chart = mountAreaChart(el, props);
```

:::

## Props

<PropsTable chart="area-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountAreaChart(el, props).getContext()` returns a renderer-agnostic **`AreaChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`AreaChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
