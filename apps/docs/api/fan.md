---
title: Fan Chart API
---

# Fan Chart API

Plot the forecast and its uncertainty in one chart: history, a dashed median, and confidence bands that widen with the horizon - see the **[Fan Chart demo](/charts/fan)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/fan-chart";
// <michi-vz-fan-chart> is now defined
```

```ts [Vanilla JS]
import { mountFanChart } from "@michi-vz/core";

const chart = mountFanChart(el, props);
```

```ts [Insights helper]
import { forecastFan } from "@michi-vz/insights/forecast";

const item = forecastFan(history, { horizon: 4, levels: [0.5, 0.8], level: 0.95 }, "Revenue");
const chart = mountFanChart(el, { dataSet: [item], xAxisDataType: "date_annual" });
```

:::

## Props

<PropsTable chart="fan-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountFanChart(el, props).getContext()` returns a renderer-agnostic **`FanChartContext`** (per-series history/forecast counts, band levels, final uncertainty, plus a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`FanChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
