---
title: Radial Tree API
---

# Radial Tree API

A radial cluster()/dendrogram: groups fan out from a centre point, leaves land on the SAME radius as every other leaf - see the **[Radial Tree demo](/charts/radial-tree)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/radial-tree-chart";
// <michi-vz-radial-tree-chart> is now defined
```

```ts [Vanilla JS]
import { mountRadialTreeChart } from "@michi-vz/core";

const chart = mountRadialTreeChart(el, props);
```

:::

## Props

<PropsTable chart="radial-tree-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected (empty groups, negative/non-finite values, duplicate labels, nesting deeper than 2 levels) |

## getContext()

`mountRadialTreeChart(el, props).getContext()` returns a renderer-agnostic **`RadialTreeChartContext`**: `stats.leafCount` / `groupCount` / `grandTotal` / `largest` (the biggest leaf) / `maxDepth`, a `nodes[]` array (one row per node - group AND leaf - with `label`, `code`, `color`, `depth`, `isLeaf`, `value`, `path`), a deterministic natural-language `summary`, and an `a11yTable`. See [LLM context](/guide/llm-context).

## Source

Props are typed as [`RadialTreeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
