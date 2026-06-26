---
title: Ribbon Chart API
---

# Ribbon Chart API

The `<michi-vz-ribbon-chart>` element and the `mountRibbonChart` engine. For examples and usage, see the **[Ribbon Chart demo](/charts/ribbon)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/ribbon-chart";
// <michi-vz-ribbon-chart> is now defined
```

```ts [Vanilla JS]
import { mountRibbonChart } from "@michi-vz/core";

const chart = mountRibbonChart(el, props);
```

:::

## Props

<PropsTable chart="ribbon-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountRibbonChart(el, props).getContext()` returns a renderer-agnostic **`RibbonChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`RibbonChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
