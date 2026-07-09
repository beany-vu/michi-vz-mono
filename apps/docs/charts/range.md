---
title: Range Chart
description: "Range chart: shade the whole spread per series (best to worst case, forecast cones, percentile bands) so uncertainty is something readers can see."
---
# Range Chart

<span class="vp-badge tip">Trends</span>

"How wide is the spread?" When a single line lies about your data, draw the band instead. Best case to worst case, the forecast cone, the 5th-to-95th percentile - this shades the whole range per series so uncertainty is something the reader can see, not guess at.

<ChartDemo chart="range-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **Whenever a single line would overstate your certainty.** Forecast cones, 5th-to-95th percentile bands, best-to-worst scenarios: the band's width is the honest answer.
- **Comparing volatility across series.** A wide band next to a narrow one is a risk statement no average conveys - portfolio spreads, SLA jitter, temperature ranges.
- **Nested confidence levels around one forecast?** That is exactly what the [Fan chart](/charts/fan) composes for you, bands and median in one call.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeRange() {
  const series = [
    { label: "India", color: "#2563eb", base: 6.5, drift: 0.02, spread: 0.8 },
    { label: "United States", color: "#16a34a", base: 2.6, drift: -0.01, spread: 0.6 },
    { label: "China", color: "#dc2626", base: 4.8, drift: -0.03, spread: 0.9 },
    { label: "Germany", color: "#7c3aed", base: 1.2, drift: 0.01, spread: 0.5 },
    { label: "Brazil", color: "#ea580c", base: 2.1, drift: 0.015, spread: 1.1 },
    { label: "Nigeria", color: "#0891b2", base: 3.4, drift: 0.02, spread: 1.3 },
    { label: "Japan", color: "#be185d", base: 0.9, drift: -0.005, spread: 0.4 },
    { label: "Indonesia", color: "#65a30d", base: 5.1, drift: 0.01, spread: 0.9 },
    { label: "France", color: "#9333ea", base: 1.4, drift: 0.005, spread: 0.5 },
    { label: "South Africa", color: "#ca8a04", base: 1.8, drift: -0.02, spread: 1.0 },
  ];
  const pointsPerSeries = 20;
  const dataSet = series.map((s) => {
    const points = [];
    for (let i = 0; i < pointsPerSeries; i++) {
      const year = 2020 + i;
      const wobble = Math.sin(i * 0.7 + s.base) * s.spread * 0.5;
      const mid = s.base + s.drift * i + wobble;
      points.push({
        date: year,
        valueMin: Number((mid - s.spread / 2).toFixed(2)),
        valueMax: Number((mid + s.spread / 2).toFixed(2)),
        valueMedium: Number(mid.toFixed(2)),
        certainty: i < pointsPerSeries - 5,
      });
    }
    return { label: s.label, color: s.color, series: points };
  });
  return { dataSet, xAxisDataType: "date_annual", fillOpacity: 0.55 };
}
</script>

RangeChart has an opt-in `renderer="webgpu"` that paints the min/max bands as GPU-instanced geometry while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo legend element="michi-vz-range-chart" :make="makeRange" caption="~200 bands" />

## Reveal animation

The chart wipes in from left to right on mount, revealing its marks in sequence before settling into place. Off by default - a chart opts in with the `progressiveDraw` prop.

<RevealDemo chart="range-chart" />

`progressiveDraw: true` enables the defaults (1200 ms, easeInOutCubic). A config object tunes it:

::: code-group

```tsx [React]
const ref = useRef<RangeChartHandle>(null);

<RangeChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() re-runs the reveal on demand
```

```vue [Vue]
<RangeChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:rangeChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRangeChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-range-chart id="c"></michi-vz-range-chart>
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

## Play through the years

The data already spans years, so there is nothing to tag. Flip on `timeline` and the chart's own play button and scrubber step through those years: at each step the bands draw only up to the active year, and playing forward smoothly extends them further as the sweep advances. Scrub backward and the bands retract to match. Hover only ever inspects what has actually been drawn. Off by default - nothing changes until a chart opts in.

<TimelinePlayDemo chart="range-chart" />

::: code-group

```tsx [React]
const ref = useRef<RangeChartHandle>(null);

<RangeChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RangeChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:rangeChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRangeChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-range-chart id="c"></michi-vz-range-chart>
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

## Usage

::: code-group

```tsx [React]
import { RangeChart } from "@michi-vz/react";

export default () => <RangeChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RangeChart } from "@michi-vz/vue";
</script>

<template>
  <RangeChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { rangeChart } from "@michi-vz/svelte";
</script>

<div use:rangeChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRangeChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-range-chart #c></michi-vz-range-chart>
applyRangeChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-range-chart id="c"></michi-vz-range-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRangeChart } from "@michi-vz/core";

const chart = mountRangeChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `RangeChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
