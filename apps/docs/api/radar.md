---
title: Radar Chart API
---

# Radar Chart API

The `<michi-vz-radar-chart>` element and the `mountRadarChart` engine. For examples and usage, see the **[Radar Chart demo](/charts/radar)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/radar-chart";
// <michi-vz-radar-chart> is now defined
```

```ts [Vanilla JS]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
```

:::

## Props

<PropsTable chart="radar-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountRadarChart(el, props).getContext()` returns a renderer-agnostic **`RadarChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`RadarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
