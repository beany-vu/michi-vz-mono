---
title: Fan Chart
---
# Fan Chart

<span class="vp-badge tip">Trends</span> <span class="vp-badge tip">Forecast</span>

**"What will revenue be next quarter?"** The honest answer is never a single number - it is a *range*, and the range is the whole point. Hand an exec one number and you are guessing; hand them this fan and you are telling the truth about the risk. The solid line is what already happened, the dashed line is the single most-likely path, and the shaded bands show how sure the forecast is - widening as they reach into the future, because the further ahead you look, the less anyone can know.

<ChartDemo chart="fan-chart" :height="380" />

## How to read it

- **Solid line - history.** The actuals you already have.
- **Dashed line - the most-likely path** (the forecast *median*): one best guess, never the whole story.
- **Nested bands - confidence.** Inner to outer = **50% / 80% / 95%**. The real value should land inside the 95% band about **19 times out of 20**. You plan against the band, not the line.
- **Why it fans out.** Next month is fairly knowable; a year out is not. Uncertainty compounds with distance, so the bands widen.

> Read your **worst case** off the bottom of the outer band and your **best case** off the top. The fan is your base / upside / downside in a single picture - no separate scenario tab needed.

## The maths, in plain terms

You do not need the equations to use the chart, but here is what is under the hood - and why you can trust it:

- **The median** comes from **Holt-Winters** exponential smoothing. It tracks two moving quantities, the current **level** and the **trend** (slope), and rolls them forward; if the series has a repeating season, it tracks that too. (Prefer a straight line? `method: "linear"` fits an ordinary least-squares regression instead.)
  > `ℓₜ = α·yₜ + (1−α)(ℓₜ₋₁ + bₜ₋₁)` · `bₜ = β(ℓₜ − ℓₜ₋₁) + (1−β)bₜ₋₁` · `ŷₜ₊ₕ = ℓₜ + h·bₜ`
- **The bands** come from the model's *own past errors*. It measures how far its fitted values missed (the residual spread `σ`) and widens the interval as `ŷ ± z·σ·√h` - `z = 1.96` for 95%, and the `√h` is exactly why the fan opens with the horizon `h`.
- **Should you trust it?** A **backtest** hides the last few real points, re-forecasts them, and reports the error (`MAPE`, `RMSE`). You get an honesty score *before* you bet on the number, not after.

All of it runs **in the browser** - no data-science backend, no server round-trip. (Power BI, by contrast, only forecasts on a line chart and stops where real modelling begins.)

> Build the data in one call with `forecastFan()` from [`@michi-vz/insights/forecast`](/guide/insights), or hand it `series` (history + `certainty:false` median) and nested `bands`.

## Usage

::: code-group

```ts [Insights (one call)]
import { mountFanChart } from "@michi-vz/core";
import { forecastFan } from "@michi-vz/insights/forecast";

// history = DataPoint[] of actuals; build the fan (median + 50/80/95% bands)
const item = forecastFan(history, { method: "holt-winters", horizon: 4, levels: [0.5, 0.8], level: 0.95 }, "Revenue");
const chart = mountFanChart(el, { dataSet: [item], xAxisDataType: "date_annual" });
```

```ts [Vanilla JS]
import { mountFanChart } from "@michi-vz/core";

const chart = mountFanChart(el, props); // props.dataSet = FanDataItem[]
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-fan-chart id="c"></michi-vz-fan-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet (series + bands), title, …
</script>
```

:::

## Data shape

A `FanDataItem` is a familiar line series plus nested bands:

```ts
interface FanDataItem {
  label: string;
  color?: string;
  series: DataPoint[];   // history (certainty:true) then forecast median (certainty:false → dashed)
  bands: { level: number; series: RangeDataPoint[] }[]; // drawn widest-first, graduated opacity
}
```

## API

Props are typed as `FanChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) and mirror `LineChartProps` (`width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer`, `highlightItems`, `disabledItems`, `fillOpacity`, and the `on*` callbacks). `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
