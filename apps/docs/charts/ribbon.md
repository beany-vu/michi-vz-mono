---
title: Ribbon Chart
description: "Ribbon chart for rank and share shifts: ribbons connect each period's columns so you can follow a category as it swells, shrinks, and trades places."
---
# Ribbon Chart

<span class="vp-badge tip">Composition</span>

Who's gaining and who's slipping? When market share, budget splits, or vote tallies reshuffle from one period to the next, the ribbons connecting each column let you follow a single category as it swells, shrinks, and trades places with its rivals.

<ChartDemo chart="ribbon-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **Market share, budget splits, league tables.** When categories trade places period to period, the ribbons make "who overtook whom, and when" the first thing readers see.
- **Presenting reshuffles to a business audience.** Each category keeps its colour as it swells, shrinks and swaps ranks, so the eye follows one competitor through the whole story.
- **If nothing ever swaps ranks**, the ribbons run parallel and an [Area chart](/charts/area) tells the same share story with less ink.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeRibbon() {
  const keys = Array.from({ length: 30 }, (_, i) => `Category ${i + 1}`);
  const palette = [
    "#e63946", "#1d3557", "#2a9d8f", "#e9c46a", "#9b5de5",
    "#f15bb5", "#00bbf9", "#00f5d4", "#fee440", "#4cb944",
  ];
  const colorsMapping = {};
  keys.forEach((k, i) => { colorsMapping[k] = palette[i % palette.length]; });
  // Each key gets a slowly drifting base weight so ribbons visibly swell/shrink/re-rank.
  const bases = keys.map(() => 2 + Math.random() * 8);
  const drifts = keys.map(() => (Math.random() - 0.5) * 0.8);
  const series = [];
  for (let p = 0; p < 15; p++) {
    const row = { date: `${2010 + p}` };
    keys.forEach((k, i) => {
      const wobble = Math.sin(p * 0.7 + i) * 1.5;
      row[k] = Math.max(0.5, bases[i] + drifts[i] * p + wobble);
    });
    series.push(row);
  }
  return { series, keys, colorsMapping };
}
</script>

RibbonChart has an opt-in `renderer="webgpu"` that paints its ribbons on the GPU while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo element="michi-vz-ribbon-chart" :make="makeRibbon" caption="dense ribbons" />

## Reveal animation

The chart wipes in from left to right on mount, revealing its marks in sequence before settling into place. Off by default - a chart opts in with the `progressiveDraw` prop.

<RevealDemo chart="ribbon-chart" />

`progressiveDraw: true` enables the defaults (1200 ms, easeInOutCubic). A config object tunes it:

::: code-group

```tsx [React]
const ref = useRef<RibbonChartHandle>(null);

<RibbonChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() re-runs the reveal on demand
```

```vue [Vue]
<RibbonChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:ribbonChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRibbonChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
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

The data already spans years, so there is nothing to tag. Flip on `timeline` and the chart's own play button and scrubber step through those years: at each step the ribbons draw only up to the active year, and playing forward smoothly extends them further as the sweep advances. Scrub backward and the ribbons retract to match. Hover only ever inspects what has actually been drawn. Off by default - nothing changes until a chart opts in.

<TimelinePlayDemo chart="ribbon-chart" />

::: code-group

```tsx [React]
const ref = useRef<RibbonChartHandle>(null);

<RibbonChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RibbonChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:ribbonChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRibbonChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
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
import { RibbonChart } from "@michi-vz/react";

export default () => <RibbonChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RibbonChart } from "@michi-vz/vue";
</script>

<template>
  <RibbonChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { ribbonChart } from "@michi-vz/svelte";
</script>

<div use:ribbonChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRibbonChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-ribbon-chart #c></michi-vz-ribbon-chart>
applyRibbonChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRibbonChart } from "@michi-vz/core";

const chart = mountRibbonChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `RibbonChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
