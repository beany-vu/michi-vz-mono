---
title: Comparable Vertical Bar API
---

# Comparable Vertical Bar API

Two values per category, based vs compared, as full-bandwidth overlapping columns with an optional change arrow above each pair - see the **[Comparable Vertical Bar demo](/charts/comparable-vertical-bar)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/comparable-vertical-bar-chart";
// <michi-vz-comparable-vertical-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountComparableVerticalBarChart } from "@michi-vz/core";

const chart = mountComparableVerticalBarChart(el, props);
```

```ts [React]
import { ComparableVerticalBarChart } from "@michi-vz/react/comparable-vertical-bar-chart";
```

```ts [Vue]
import { ComparableVerticalBarChart } from "@michi-vz/vue/comparable-vertical-bar-chart";
```

```ts [Svelte]
import { comparableVerticalBarChart } from "@michi-vz/svelte/comparable-vertical-bar-chart";
```

```ts [Angular]
import { bindChart, applyComparableVerticalBarChartProps } from "@michi-vz/angular/comparable-vertical-bar-chart";
// needs CUSTOM_ELEMENTS_SCHEMA on the component that hosts <michi-vz-comparable-vertical-bar-chart>
```

:::

## Props

<PropsTable chart="comparable-vertical-bar-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountComparableVerticalBarChart(el, props).getContext()` returns a renderer-agnostic **`ComparableVerticalBarChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). Unlike ComparableHorizontalBarChart, this context reflects the `deltaIndicator` when active: `series[].deltaDirection` / `deltaColor` / `deltaLabel`, and `stats.grew` / `stats.shrank` / `stats.unchanged` / `stats.improved` / `stats.worsened`. See [LLM context](/guide/llm-context).

## Source

Props are typed as [`ComparableVerticalBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
