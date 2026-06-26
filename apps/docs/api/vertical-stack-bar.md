---
title: Vertical Stack Bar API
---

# Vertical Stack Bar API

The `<michi-vz-vertical-stack-bar-chart>` element and the `mountVerticalStackBarChart` engine. For examples and usage, see the **[Vertical Stack Bar demo](/charts/vertical-stack-bar)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/vertical-stack-bar-chart";
// <michi-vz-vertical-stack-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountVerticalStackBarChart } from "@michi-vz/core";

const chart = mountVerticalStackBarChart(el, props);
```

:::

## Props

<PropsTable chart="vertical-stack-bar-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountVerticalStackBarChart(el, props).getContext()` returns a renderer-agnostic **`VerticalStackBarChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`VerticalStackBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
