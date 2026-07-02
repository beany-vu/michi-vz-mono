---
title: Fan Chart
description: "Fan chart for forecasts with uncertainty: solid history, a dashed most-likely path, and confidence bands that widen into the future."
---
# Fan Chart

<span class="vp-badge tip">Trends</span> <span class="vp-badge tip">Forecast</span>

**"What will revenue be next quarter?"** The honest answer is never a single number - it is a *range*, and the range is the whole point. Hand an exec one number and you are guessing; hand them this fan and you are telling the truth about the risk. The solid line is what already happened, the dashed line is the single most-likely path, and the shaded bands show how sure the forecast is - widening as they reach into the future, because the further ahead you look, the less anyone can know.

<ChartDemo chart="fan-chart" :height="380" />

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeFan() {
  const n = 1500;
  const dataSet = [];
  const bands = [];
  let level = 100;
  const cutoff = Math.round(n * 0.85);
  for (let i = 0; i < n; i++) {
    level += (Math.random() - 0.48) * 2 + Math.sin(i / 40) * 0.6;
    const certainty = i < cutoff;
    dataSet.push({ date: i, value: Math.round(level * 100) / 100, certainty });
    if (!certainty) {
      const h = i - cutoff + 1;
      const spread = Math.sqrt(h) * 1.8;
      bands.push({ date: i, valueMin: Math.round((level - spread) * 100) / 100, valueMax: Math.round((level + spread) * 100) / 100, valueMedium: Math.round(level * 100) / 100 });
    } else {
      bands.push({ date: i, valueMin: level, valueMax: level, valueMedium: level });
    }
  }
  return {
    dataSet: [
      {
        label: "Revenue",
        color: "#2563eb",
        series: dataSet,
        bands: [{ level: 0.95, series: bands }],
      },
    ],
    xAxisDataType: "number",
    fillOpacity: 0.22,
  };
}
</script>

FanChart's opt-in `renderer="webgpu"` paints its line and band marks on the GPU while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-fan-chart" :make="makeFan" caption="~1,500 points" />

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
