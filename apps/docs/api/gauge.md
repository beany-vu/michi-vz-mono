---
title: Gauge (Rings) API
---

# Gauge (Rings) API

Concentric rings, outer to inner, each sweeping `value / max` of a full circle over a background track - see the **[Gauge demo](/charts/gauge)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/gauge-chart";
// <michi-vz-gauge-chart> is now defined
```

```ts [Vanilla JS]
import { mountGaugeChart } from "@michi-vz/core";

const chart = mountGaugeChart(el, props);
```

:::

## Props

<PropsTable chart="gauge-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountGaugeChart(el, props).getContext()` returns a renderer-agnostic **`GaugeChartContext`**: the `max` scale, the `rings` (label / value / fraction / index, outer to inner), summary stats (ring count, largest ring), a deterministic natural-language summary, and an a11y table. See [LLM context](/guide/llm-context).

## Source

Props are typed as [`GaugeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
