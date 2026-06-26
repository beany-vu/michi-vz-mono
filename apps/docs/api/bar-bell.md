---
title: Bar-Bell API
---

# Bar-Bell API

The `<michi-vz-bar-bell-chart>` element and the `mountBarBellChart` engine. For examples and usage, see the **[Bar-Bell demo](/charts/bar-bell)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/bar-bell-chart";
// <michi-vz-bar-bell-chart> is now defined
```

```ts [Vanilla JS]
import { mountBarBellChart } from "@michi-vz/core";

const chart = mountBarBellChart(el, props);
```

:::

## Props

<PropsTable chart="bar-bell-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountBarBellChart(el, props).getContext()` returns a renderer-agnostic **`BarBellChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`BarBellChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
