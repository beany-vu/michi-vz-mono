---
title: Comparable Bar API
---

# Comparable Bar API

Two values per label, based vs compared, so before/after shifts read at a glance - see the **[Comparable Bar demo](/charts/comparable)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/comparable-horizontal-bar-chart";
// <michi-vz-comparable-horizontal-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountComparableHorizontalBarChart } from "@michi-vz/core";

const chart = mountComparableHorizontalBarChart(el, props);
```

:::

## Props

<PropsTable chart="comparable-horizontal-bar-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountComparableHorizontalBarChart(el, props).getContext()` returns a renderer-agnostic **`ComparableBarChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`ComparableBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
