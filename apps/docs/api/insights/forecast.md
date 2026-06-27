---
title: Forecast API
---

# Forecast API

A plugin that turns any time chart into a forecast, projecting future steps with a confidence band; for the story and live demos, see the **[Insights guide](/guide/insights)**.

## Import

```ts
import { forecast } from "@michi-vz/insights/forecast";
```

`forecast(options?)` returns a plugin you pass in the chart's mount options. It works on Line, Fan, Range, Area, Vertical-Stack-Bar, Ribbon, and Bar-Bell charts.

```ts
mountLineChart(el, props, { plugins: [forecast({ horizon: 4 })] });
```

## Signature & options

| Name | Type | Default | What it does |
| --- | --- | --- | --- |
| `method` | `"holt-winters"` or `"linear"` (lazy `"arima"`) | `"holt-winters"` | Forecasting model used to project future steps. |
| `horizon` | `number` | `4` | Number of future steps to forecast. |
| `level` | `number` | `0.95` | Confidence level for the prediction band. |
| `levels` | `number[]` | optional | Extra nested band levels for a fan chart. |
| `target` | `string` or `string[]` | all | Restrict the forecast to these series labels. |
| `scenarios` | `Array<{ name: string; growth: number }>` | optional | What-if lines drawn from custom growth rates. |
| `trendline` | `boolean` | `false` | Overlay a regression line. |
| `threshold` | `{ value: number; label?: string }` | optional | Reference line plus a projected "fall point". |
| `onThresholdBreach` | `(b) => void` | optional | Fires when the forecast is projected to cross the threshold. |
| `zone` | `boolean` | `true` | Shade the forecast region to highlight prediction versus actual. |

Also exported from this subpath: `forecastFan(history, options?, label?)`, `computeForecast`, `decompose`, `detectPeriod`, `detectChangepoints`, `monteCarloForecast`, `requiredGrowth`, `requiredRunRate`, `pacingToGoal`, and `FORECASTABLE_CHARTS`.

## Example

```ts
import { mountLineChart } from "@michi-vz/core";
import { forecast } from "@michi-vz/insights/forecast";

mountLineChart(el, props, {
  plugins: [
    forecast({
      method: "holt-winters",
      horizon: 4,
      threshold: { value: 200, label: "Target" },
      zone: true,
    }),
  ],
});
```

**[Insights guide](/guide/insights)**
