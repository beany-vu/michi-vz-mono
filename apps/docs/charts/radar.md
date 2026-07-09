---
title: Radar Chart
description: "Radar chart for comparing options across shared criteria: each candidate becomes a polygon whose spikes and dents show strengths and weaknesses at a glance."
---
# Radar Chart

<span class="vp-badge tip">Comparison</span>

Which option wins, and where? Lay a few candidates over the same set of criteria and each one becomes a polygon you can read in a glance - the spikes show every strength, the dents show every weakness, and the overlaps show exactly where they trade places.

<ChartDemo chart="radar-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **Scorecards.** Vendor evaluations, candidate assessments, product benchmarks: a few options over the same criteria, each a polygon whose spikes and dents are its strengths and weaknesses.
- **Balance vs specialisation.** A rounder polygon is the all-rounder; a spiky one bets everything on two axes. That shape story is what tables cannot tell.
- **Keep it to a few entities and 5-12 axes.** For a precise comparison on one criterion, a [Comparable bar](/charts/comparable) reads exact values; the radar reads profiles.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeRadar() {
  const axes = [
    "Healthcare", "Education", "Cost of living", "Safety",
    "Environment", "Culture", "Infrastructure", "Climate",
    "Jobs", "Nightlife", "Walkability", "Diversity",
  ];
  const palette = ["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e"];
  const names = ["Vienna", "Singapore", "Lisbon", "Auckland"];
  const series = names.map((label, i) => ({
    label,
    color: palette[i],
    values: axes.map(() => Math.round(20 + Math.random() * 80)),
  }));
  return { axes, series, maxValue: 100, fillOpacity: 0.2 };
}
</script>

RadarChart has an opt-in `renderer="webgpu"` that paints the polygon fills and pole markers as GPU-instanced marks while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo legend element="michi-vz-radar-chart" :make="makeRadar" caption="12 axes × 4 series" />

## Play through the years

RadarChart already uses `date` for the legacy per-axis `{ date, value }` shape, so the timeline tag is named `period` instead. Tag every series row with a `period` and flip on `timeline`: a year's snapshot is the rows sharing that period, and each polygon tweens between years. Off by default - nothing changes until a chart opts in. This is interactive year-by-year stepping, not the one-shot entrance further down.

```ts
{ label: "Vienna", period: "2021", values: [72, 65, 40, 88 /* … */] }
```

<TimelinePlayDemo chart="radar-chart" />

::: code-group

```tsx [React]
const ref = useRef<RadarChartHandle>(null);

<RadarChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RadarChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:radarChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRadarChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` sets the pace, `loop` wraps around, `autoplay: true` starts on mount, `showControl: false` hides the built-in bar.
- Values glide between periods by default (`interpolate`); tune the motion with `tweenMs` and `easing`, or set `interpolate: false` for hard cuts. Reduced motion always gets the hard cut.
- The headless controller is always available: `chart.timeline()` exposes `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` and `formatPeriod` in the config for custom UI.
- Series without a `period` stay visible in every period.
- `timeline` wins over `progressiveDraw` when both are set - the reveal animation further down stays off while the timeline is in control.

## Reveal animation

The chart wipes in from left to right on mount, revealing its marks in sequence before settling into place. Off by default - a chart opts in with the `progressiveDraw` prop.

<RevealDemo chart="radar-chart" />

`progressiveDraw: true` enables the defaults (1200 ms, easeInOutCubic). A config object tunes it:

::: code-group

```tsx [React]
const ref = useRef<RadarChartHandle>(null);

<RadarChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() re-runs the reveal on demand
```

```vue [Vue]
<RadarChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:radarChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRadarChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
<script>
  const el = document.getElementById("c");
  el.progressiveDraw = { durationMs: 2000 };
  // el.replay() re-runs the reveal
</script>
```

:::

- `durationMs` and `easing` ("linear", "easeOutQuad", "easeInOutCubic", or a custom `(t) => t` function) shape the sweep.
- `autoplay: false` renders the chart fully drawn; call `replay()` (React ref handle, web-component method, or the core instance) to run the reveal on demand. `replayOnUpdate: true` re-runs it on every data change.
- Respects `prefers-reduced-motion`: the chart renders fully drawn instantly.
- Reveal animation is a one-shot entrance; play through the years above steps through data year by year instead.

## Usage

::: code-group

```tsx [React]
import { RadarChart } from "@michi-vz/react";

export default () => <RadarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RadarChart } from "@michi-vz/vue";
</script>

<template>
  <RadarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { radarChart } from "@michi-vz/svelte";
</script>

<div use:radarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRadarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-radar-chart #c></michi-vz-radar-chart>
applyRadarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `RadarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
