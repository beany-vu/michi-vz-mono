---
title: Dual Bar (Tornado) API
---

# Dual Bar (Tornado) API

The `<michi-vz-dual-horizontal-bar-chart>` element and the `mountDualHorizontalBarChart` engine. For examples and usage, see the **[Dual Bar (Tornado) demo](/charts/dual)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/dual-horizontal-bar-chart";
// <michi-vz-dual-horizontal-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountDualHorizontalBarChart } from "@michi-vz/core";

const chart = mountDualHorizontalBarChart(el, props);
```

:::

## Props

<PropsTable chart="dual-horizontal-bar-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountDualHorizontalBarChart(el, props).getContext()` returns a renderer-agnostic **`DualBarChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`DualBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
