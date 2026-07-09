---
title: Bar-Bell
description: "Bar-bell chart: each row lays its parts end to end with an end-cap at every step, so cumulative reach and each segment's share read at a glance."
---
# Bar-Bell

<span class="vp-badge tip">Composition</span>

How does a running total stack up, piece by piece? Each row lays its parts end to end with an end-cap at every step, so the cumulative reach and each segment's share both read at a glance.

<ChartDemo chart="bar-bell-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **Funnels and cumulative build-ups.** How the parts stack to a total, row by row, with an end-cap marking every step - pipeline stages, cost build-ups, mileage accumulations.
- **Two audiences, one row.** The analyst reads each segment's contribution off the caps; the exec reads the final reach off the row's end. Nobody needs a second chart.
- **If comparing the same segment across rows matters more than each row's running total**, the [Vertical Stack Bar](/charts/vertical-stack-bar) lines the segments up for you.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeBarBell() {
  const keys = ["Asia-Pacific", "Europe", "North America"];
  const colorsMapping = {
    "Asia-Pacific": "#d62728",
    "Europe": "#2ca02c",
    "North America": "#1f77b4",
  };
  const dataSet = [];
  let asia = 40, europe = 20, america = 10;
  for (let i = 0; i < 120; i++) {
    asia += Math.random() * 12;
    europe += Math.random() * 6;
    america += Math.random() * 4;
    dataSet.push({
      date: String(2000 + i),
      "Asia-Pacific": Math.round(asia),
      "Europe": Math.round(europe),
      "North America": Math.round(america),
    });
  }
  return { dataSet, keys, colorsMapping };
}
</script>

BarBellChart has an opt-in `renderer="webgpu"` that paints the segment bars and end-cap circles as GPU-instanced marks while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo legend element="michi-vz-bar-bell-chart" :make="makeBarBell" caption="~120 rows" />

## Play through the years

BarBellChart already uses `date` for the row's category (the band on the y-axis), so the timeline tag is named `period` instead. Tag every row with a `period` and flip on `timeline`: a year's snapshot is the rows sharing that period, and each segment's length tweens between years. Off by default - nothing changes until a chart opts in. This is interactive year-by-year stepping, not the one-shot entrance further down.

```ts
{ period: "2021", date: "Kenya", exports: 40, domestic: 25 }
```

<TimelinePlayDemo chart="bar-bell-chart" />

::: code-group

```tsx [React]
const ref = useRef<BarBellChartHandle>(null);

<BarBellChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<BarBellChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:barBellChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyBarBellChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
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
- Rows without a `period` stay visible in every period.
- `timeline` wins over `progressiveDraw` when both are set - the reveal animation further down stays off while the timeline is in control.

## Reveal animation

The chart wipes in from left to right on mount, revealing its marks in sequence before settling into place. Off by default - a chart opts in with the `progressiveDraw` prop.

<RevealDemo chart="bar-bell-chart" />

`progressiveDraw: true` enables the defaults (1200 ms, easeInOutCubic). A config object tunes it:

::: code-group

```tsx [React]
const ref = useRef<BarBellChartHandle>(null);

<BarBellChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() re-runs the reveal on demand
```

```vue [Vue]
<BarBellChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:barBellChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyBarBellChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
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
import { BarBellChart } from "@michi-vz/react";

export default () => <BarBellChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { BarBellChart } from "@michi-vz/vue";
</script>

<template>
  <BarBellChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { barBellChart } from "@michi-vz/svelte";
</script>

<div use:barBellChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyBarBellChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-bar-bell-chart #c></michi-vz-bar-bell-chart>
applyBarBellChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountBarBellChart } from "@michi-vz/core";

const chart = mountBarBellChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `BarBellChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
