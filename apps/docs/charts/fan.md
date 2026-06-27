---
title: Fan Chart
---
# Fan Chart

<span class="vp-badge tip">Trends</span> <span class="vp-badge tip">Forecast</span>

"Where does this land next quarter, and how sure are we?" The solid history hands off to a dashed median, and the 50/80/95% bands fan out so the further you look, the wider the doubt - exactly the honest picture an exec wants before signing off on a forecast. Built from the Line + Range primitives, so it shares the Line prop surface with no bespoke geometry.

<ChartDemo chart="fan-chart" :height="380" />

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
