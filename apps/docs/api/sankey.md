---
title: Sankey API
---

# Sankey API

Flows between nodes laid out in columns, with band thickness proportional to the flow value (built on d3-sankey) - see the **[Sankey demo](/charts/sankey)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/sankey-chart";
// <michi-vz-sankey-chart> is now defined
```

```ts [Vanilla JS]
import { mountSankeyChart } from "@michi-vz/core";

const chart = mountSankeyChart(el, props);
```

:::

## Props

<PropsTable chart="sankey-chart" />

::: tip Data is two arrays
Unlike the other charts, a Sankey takes `nodes` (`{ id, label?, color? }[]`) and `links` (`{ source, target, value }[]`) instead of a single `dataSet`.
:::

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes (node id, or a link's source + target) |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected (e.g. a link to an unknown node) |

## getContext()

`mountSankeyChart(el, props).getContext()` returns a renderer-agnostic **`SankeyChartContext`**: the `nodes` (id / label / color / value / column depth), the `links` (source / target / value / color), summary stats (node & link counts, column count, total flow, largest link, busiest node), a deterministic natural-language summary, and an a11y table listing the flows. See [LLM context](/guide/llm-context).

## Source

Props are typed as [`SankeyChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
