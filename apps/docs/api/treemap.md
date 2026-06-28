---
title: Treemap API
---

# Treemap API

Hierarchical tiles sized by value, each optionally split into two named parts (e.g. realized vs untapped), with a mobile-friendly stack fallback - see the **[Treemap demo](/charts/treemap)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/treemap-chart";
// <michi-vz-treemap-chart> is now defined
```

```ts [Vanilla JS]
import { mountTreemapChart } from "@michi-vz/core";

const chart = mountTreemapChart(el, props);
```

:::

## Props

<PropsTable chart="treemap-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountTreemapChart(el, props).getContext()` returns a renderer-agnostic **`TreemapChartContext`**: the flat `leaves` (value / partial / remainder / percent / path), the resolved `layout`, `splitLabels`, nesting `depth`, summary stats (grand total, totals per part, largest leaf, largest remainder), a deterministic natural-language summary, and an a11y table. See [LLM context](/guide/llm-context).

## Source

Props are typed as [`TreemapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
