---
title: Line Chart
description: "Line chart for time series: one series or fifty, missing periods rendered as dashes, and an opt-in canvas renderer with LTTB decimation for thousands of points."
---
# Line Chart

<span class="vp-badge tip">Trends</span>

"How did this move over time, and where can't I trust the data?" One series or fifty, with missing periods rendered as dashes so a reporting gap never reads as a real dip - plus an opt-in canvas renderer (LTTB-decimated for big data) when the points run into the thousands.

<ChartDemo chart="line-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **Tracking a KPI's trajectory.** Revenue by month, users by week, latency by hour - anywhere "how did it move?" is the question, the line answers it faster than any table.
- **Comparing a handful of series on one scale**, with reporting gaps kept honest: a missing period renders as a dash, never a fake dip an exec might act on.
- **Big data included.** Thousands of points stay smooth with the opt-in canvas renderer (LTTB decimation). But if the story is a prediction rather than history, the [Fan chart](/charts/fan) shows the range, not just the line.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeLine() {
  const seriesLabels = [
    { label: "Germany", color: "#1f9e57" },
    { label: "United Kingdom", color: "#2c6fbb" },
    { label: "France", color: "#e63946" },
    { label: "Spain", color: "#e9c46a" },
    { label: "Italy", color: "#2a9d8f" },
    { label: "Poland", color: "#9b5de5" },
    { label: "Sweden", color: "#f4a261" },
    { label: "Netherlands", color: "#264653" },
  ];
  const POINTS_PER_SERIES = 2000;
  const START_YEAR = 1900;
  const dataSet = seriesLabels.map((s, si) => {
    let value = 20 + si * 5;
    const series = [];
    for (let i = 0; i < POINTS_PER_SERIES; i++) {
      value += (Math.random() - 0.5) * 2;
      value = Math.max(0, Math.min(100, value));
      series.push({
        date: START_YEAR + i,
        value: Math.round(value * 100) / 100,
        certainty: true,
      });
    }
    return { label: s.label, color: s.color, series };
  });
  return { dataSet, xAxisDataType: "date_annual", showDataPoints: false };
}

function makeNoDataLine() {
  // 24 months of Jan 2022 - Dec 2023, but several months are MISSING from the data
  // (2022-04/05/09, 2023-02/03) so the "fill" toggle has real gaps to reveal.
  const present = [
    "2022-01", "2022-02", "2022-03", "2022-06", "2022-07", "2022-08",
    "2022-10", "2022-11", "2022-12", "2023-01", "2023-04", "2023-05",
    "2023-06", "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  ];
  const mk = (base, amp) =>
    present.map((date, i) => ({
      date,
      value: Math.round((base + Math.sin(i / 2) * amp) * 10) / 10,
      certainty: true,
    }));
  return {
    dataSet: [
      { label: "Exports", color: "#2c6fbb", series: mk(60, 12) },
      { label: "Imports", color: "#e07b39", series: mk(45, 9) },
    ],
    xAxisDataType: "date_monthly",
    xAxisFormat: (d) => {
      const dt = new Date(Number(d));
      return (
        dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) +
        " " +
        String(dt.getUTCFullYear()).slice(2)
      );
    },
    noDataTickTooltip: () => "No data reported for this month",
  };
}
</script>

The line chart's opt-in `renderer="webgpu"` paints its line/marker geometry on the GPU while axes, labels and tooltips stay on the SVG layer; it is capability-gated with automatic canvas fallback when WebGPU is unavailable.

<WebgpuHeavyDemo legend element="michi-vz-line-chart" :make="makeLine" caption="~16,000 points" />

## Gap detection

A missing period renders as a **dashed** segment - set it per point with `certainty: false`, or let `detectGaps` derive it. Here one series skips a reporting period:

<ChartDemo chart="line-chart" :index="1" />

## Continuous timeline & no-data ticks

By default the x-axis is honest about time in two ways: **the first and last period are never dropped** (even when they land on an "unround" month d3 would otherwise skip), and crowded labels tilt to -45° then thin to ~5 - always keeping both ends.

Opt into `fillPeriodTicks` and the axis draws a tick for **every** period in range, not just the ones with data. Months with no value render **faded**; hover one to explain the gap. Flip the toggle:

<NoDataTicksDemo :make="makeNoDataLine" />

Customize it: `noDataTickTooltip(epochMs)` returns the tooltip text (plain string or sanitized HTML), and `noDataTickColor` (or the `--michi-vz-tick-nodata` CSS var) sets the faded colour.

::: code-group

```tsx [React]
<LineChart
  {...props}
  xAxisDataType="date_monthly"
  fillPeriodTicks
  noDataTickTooltip={() => "No data reported for this month"}
  noDataTickColor="#c0392b"
/>
```

```vue [Vue]
<LineChart :options="{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }" />
```

```svelte [Svelte]
<div use:lineChart={{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }}></div>
```

```ts [Angular]
applyLineChartProps(this.c.nativeElement, {
  ...props,
  fillPeriodTicks: true,
  noDataTickTooltip: () => "No data",
});
```

```html [Web component]
<michi-vz-line-chart id="c" fill-period-ticks no-data-tick-color="#c0392b"></michi-vz-line-chart>
<script>
  document.getElementById("c").noDataTickTooltip = () => "No data reported";
</script>
```

:::

## Play through the years

The data already spans years, so there is nothing to tag. Flip on `timeline` and the chart's own play button and scrubber step through those years: at each step the line draws only up to the active year, and playing forward smoothly extends it further as the sweep advances. Scrub backward and the line retracts to match. Hover only ever inspects what has actually been drawn. This is the interactive, year-by-year version: scrub or step through the real years in the data. For a one-shot cinematic sweep instead, see Progressive draw and tip labels below. Off by default - nothing changes until a chart opts in.

<TimelinePlayDemo chart="line-chart" />

::: code-group

```tsx [React]
const ref = useRef<LineChartHandle>(null);

<LineChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<LineChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:lineChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyLineChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-line-chart id="c"></michi-vz-line-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` sets the pace, `loop` wraps around, `autoplay: true` starts on mount, `showControl: false` hides the built-in bar.
- The headless controller is always available: `chart.timeline()` exposes `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` and `formatPeriod` in the config for custom UI.
- Values glide between years by default (`interpolate`); set `interpolate: false` for hard jump-cuts. Reduced motion always jump-cuts.
- `timeline` wins over `progressiveDraw` when both are set on the same chart.
- `tipLabel: true` in the `timeline` config keeps a label riding the line's growing tip while it plays - the same tip label as `progressiveDraw`, just driven by the sweep instead of the one-shot reveal.

## Progressive draw and tip labels

Let the chart tell its story in order: with `progressiveDraw`, every line draws itself from the first year to the last, and an optional tip label rides each line's end showing the series name and its current value, settling next to the finished line. This is a one-shot cinematic sweep on mount; for interactive year-by-year stepping with a scrubber, see Play through the years above. Off by default - nothing changes until a chart opts in.

<ProgressiveDrawDemo />

`progressiveDraw: true` enables the defaults (1200 ms, easeInOutCubic). A config object tunes it:

::: code-group

```tsx [React]
const ref = useRef<LineChartHandle>(null);

<LineChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000, tipLabel: true }}
/>;
// ref.current?.replay() re-runs the reveal on demand
```

```vue [Vue]
<LineChart :options="{ ...props, progressiveDraw: { durationMs: 2000, tipLabel: true } }" />
```

```svelte [Svelte]
<div use:lineChart={{ ...props, progressiveDraw: { durationMs: 2000, tipLabel: true } }}></div>
```

```ts [Angular]
applyLineChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000, tipLabel: true },
});
```

```html [Web component]
<michi-vz-line-chart id="c"></michi-vz-line-chart>
<script>
  const el = document.getElementById("c");
  el.progressiveDraw = { durationMs: 2000, tipLabel: true };
  // el.replay() re-runs the reveal
</script>
```

:::

- `durationMs` and `easing` ("linear", "easeOutQuad", "easeInOutCubic", or a custom `(t) => t` function) shape the sweep.
- `tipLabel: true` draws the moving label; `{ content: "name" | "value" | "both", format }` narrows or rewrites its text. The value shown is always a real data point, never an interpolated number.
- `autoplay: false` renders the chart fully drawn; call `replay()` (React ref handle, web-component method, or the core instance) to run the reveal on demand. `replayOnUpdate: true` re-runs it on every data change.
- Respects `prefers-reduced-motion`: the chart renders fully drawn instantly.
- While the reveal runs, the crosshair and tooltips stop at the reveal edge, so hovering never inspects data that is not drawn yet. The webgpu renderer skips the animation.

## Usage

::: code-group

```tsx [React]
import { LineChart } from "@michi-vz/react";

export default () => <LineChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { LineChart } from "@michi-vz/vue";
</script>

<template>
  <LineChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { lineChart } from "@michi-vz/svelte";
</script>

<div use:lineChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyLineChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-line-chart #c></michi-vz-line-chart>
applyLineChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-line-chart id="c"></michi-vz-line-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Loading and no-data states

Pass `isLoading` while your data fetch is in-flight; the engine shows a `.mv-loading` overlay and sets `data-mv-state="loading"` on the host.

When the fetch resolves to nothing, `isNodata` takes over. The default predicate treats an empty `dataSet` (or every series being empty) as no-data - you can override it with a boolean or a function:

```tsx [React]
// boolean shortcut
<LineChart isLoading={query.isPending} isNodata={query.data?.length === 0} noDataLabel="No data available" />

// function predicate
<LineChart isNodata={(ds) => ds.every(s => s.data.length === 0)} />
```

In React the `isNodataComponent` and `isLoadingComponent` props accept any `ReactNode`. The engine stays mounted (so `onChartDataProcessed` still fires); your node is rendered as an overlay on top of the chart host, and `suppressDefaultOverlay` is set automatically so the built-in `.mv-nodata` message is hidden:

```tsx [React]
<LineChart
  isLoading={isPending}
  isLoadingComponent={<Spinner />}
  isNodata={isEmpty}
  isNodataComponent={<p className="no-data">No results for this selection.</p>}
/>
```

For vanilla JS / other frameworks the built-in overlay is shown by default. Suppress it and render your own node alongside the chart host:

```ts [Vanilla JS]
const chart = mountLineChart(el, { ...props, suppressDefaultOverlay: true });
// render your overlay next to el when data-mv-state === "nodata"
```

## Axis configuration

| Prop | Default | Effect |
|---|---|---|
| `yTicks` | `10` | Number of y-axis tick intervals |
| `showGridLines` | `true` | Horizontal (y) dashed gridlines |
| `showVerticalGridLines` | `false` | Vertical (x) dashed gridlines |
| `highlightZeroLine` | `true` | Draws y = 0 as a solid line |

The zero line colour defaults to the grid colour (`--michi-vz-grid`). Override it independently:

```css
.my-chart-host {
  --michi-vz-zero-line: #e53935; /* solid red zero line */
  --michi-vz-grid: #e0e0e0;      /* dashed gridlines stay grey */
}
```

```tsx [React]
<LineChart
  yTicks={5}
  showGridLines={true}
  showVerticalGridLines={false}
  highlightZeroLine={true}
/>
```

## Font family

Pass `fontFamily` to keep SVG labels and canvas text in sync. The engine writes `--michi-vz-font-family` on the chart host; both the SVG `<text>` elements and the canvas `ctx.font` path read that computed style, so no font embedding is required - the family just needs to be loaded by the page already.

```tsx [React]
<LineChart fontFamily="Inter, sans-serif" />
```

```ts [Vanilla JS]
mountLineChart(el, { ...props, fontFamily: "Inter, sans-serif" });
```

## Colours and legend data

Line colours follow the **`data-label-safe` CSS contract**. Each series element carries a `data-label-safe` attribute (the sanitized series label); you target it in CSS to set the stroke colour. The canvas renderer probes those computed styles at render time, so the same CSS rules drive both renderers.

`onChartDataProcessed` (and `getContext()`) emit a `legendData` array on the [ChartContext](/guide/llm-context). Each entry has `{ label, color, order, disabled?, dataLabelSafe }`. A colour authority (e.g. a provider component) can read these entries and emit the matching CSS:

```tsx [React]
<LineChart
  onChartDataProcessed={(ctx) => {
    ctx.legendData?.forEach(({ dataLabelSafe, color }) => {
      // write `.line[data-label-safe="${dataLabelSafe}"] { stroke: ${color} }` into a <style> tag
    });
  }}
/>
```

## API

Props are typed as `LineChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
