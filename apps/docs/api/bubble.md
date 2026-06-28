---
title: Bubble API
---

# Bubble API

Gravity-clustered circles sized by value, each optionally split into a realized core and an untapped ring - see the **[Bubble demo](/charts/bubble)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/bubble-chart";
// <michi-vz-bubble-chart> is now defined
```

```ts [Vanilla JS]
import { mountBubbleChart } from "@michi-vz/core";

const chart = mountBubbleChart(el, props);
```

:::

## Props

<PropsTable chart="bubble-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountBubbleChart(el, props).getContext()` returns a renderer-agnostic **`BubbleChartContext`**: the flat `bubbles` (value / partial / remainder / percent), `splitLabels`, summary stats (bubble count, total, totals per part, largest bubble, largest remainder), a deterministic natural-language summary, and an a11y table. See [LLM context](/guide/llm-context).

## Source

Props are typed as [`BubbleChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
