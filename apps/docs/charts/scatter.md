---
title: Scatter Plot
description: "Scatter plot with trend, clusters, and outliers at a glance; bubble size carries a third variable and the Pearson correlation comes back in getContext()."
---
# Scatter Plot

<span class="vp-badge tip">Correlation</span>

Does more of X really move Y, or are you chasing a coincidence? Plot your points and the trend, the clusters, and the outliers all surface at a glance, with bubble size carrying a third variable for free. The Pearson correlation comes back in getContext(), so you can quote the number instead of squinting at the cloud.

<ChartDemo chart="scatter-chart" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## When to reach for it

- **Testing a hypothesis.** Does spend move conversion? Does tenure move churn? The cloud, the trend and the outliers answer at a glance, and `getContext()` hands you the Pearson r to quote in the write-up.
- **Finding segments before the average hides them.** Clusters and outliers jump out of a scatter long before they surface in a summary table - the analyst's first look at any new dataset.
- **If one axis is time, use a [Line chart](/charts/line)** - a scatter treats time as just another number and loses the reading order your audience expects.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
// A nod to particle physics: a simulated LHC-style dimuon spectrum. Resonances
// (J/psi, psi(2S), the three Upsilons) sit as sharp vertical bands over a falling
// continuum background - structure you can only see when all 50k events render.
function makeScatter() {
  const g = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pT = () => {
    // Falling pT spectrum; resample the rare high tail instead of clamping
    // (a clamp piles points into a fake line at the top of the plot).
    let v;
    do { v = -8 * Math.log(1 - Math.random()); } while (v > 48);
    return v;
  };
  const resonances = [
    { label: "J/ψ", color: "#e63946", mass: 3.097, width: 0.07, n: 9000 },
    { label: "ψ(2S)", color: "#f4a261", mass: 3.686, width: 0.08, n: 2200 },
    { label: "Υ(1S)", color: "#2a9d8f", mass: 9.46, width: 0.1, n: 5200 },
    { label: "Υ(2S)", color: "#457b9d", mass: 10.023, width: 0.11, n: 2600 },
    { label: "Υ(3S)", color: "#9b5de5", mass: 10.355, width: 0.11, n: 1500 },
  ];
  const dataSet = [];
  const colorsMapping = { "Continuum μμ": "#b8bdc7" };
  // Background FIRST so the resonance points paint on top of it, not under it.
  for (let i = 0; i < 29500; i++) {
    // Continuum: density falls toward high mass, like the real background.
    dataSet.push({ label: "Continuum μμ", x: 2 + 10 * Math.pow(Math.random(), 2.2), y: pT() });
  }
  for (const r of resonances) {
    colorsMapping[r.label] = r.color;
    for (let i = 0; i < r.n; i++) {
      dataSet.push({ label: r.label, x: r.mass + g() * r.width, y: pT() });
    }
  }
  return {
    title: "Simulated dimuon events: invariant mass (GeV) vs pT (GeV)",
    dataSet, colorsMapping,
    xAxisDataType: "number", xAxisDomain: [2, 12], yAxisDomain: [0, 50], sizeRange: [2, 2],
  };
}
</script>

ScatterChart has an opt-in `renderer="webgpu"` that paints the point cloud as GPU-instanced circles while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

The demo below is a nod to particle physics: 50,000 simulated dimuon events over a falling continuum background. The sharp vertical bands are the J/ψ, ψ(2S) and Υ(1S/2S/3S) resonances, the same structure an LHC dimuon spectrum shows, and exactly the kind of point cloud a GPU renderer exists for.

<WebgpuHeavyDemo element="michi-vz-scatter-chart" :make="makeScatter" legend caption="50,000 simulated dimuon events" />

## Play through the years

The Gapminder move: tag each point with a `date`, turn on `timeline`, and watch the scatter drift year by year with the built-in play button and scrubber. Off by default - nothing changes until a chart opts in.

<TimelinePlayDemo chart="scatter" />

::: code-group

```tsx [React]
const ref = useRef<ScatterChartHandle>(null);

<ScatterChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<ScatterChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:scatterChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyScatterChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-scatter-chart id="c"></michi-vz-scatter-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` sets the pace, `loop` wraps around, `autoplay: true` starts on mount, `showControl: false` hides the built-in bar.
- The headless controller is always available: `chart.timeline()` exposes `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` and `formatPeriod` in the config for custom UI.
- Pair it with `pointLabels` so every bubble stays named while it moves; a `filter` still applies inside each period.
- Points without a `date` stay visible in every period.

## Usage

::: code-group

```tsx [React]
import { ScatterChart } from "@michi-vz/react";

export default () => <ScatterChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ScatterChart } from "@michi-vz/vue";
</script>

<template>
  <ScatterChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { scatterChart } from "@michi-vz/svelte";
</script>

<div use:scatterChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyScatterChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-scatter-chart #c></michi-vz-scatter-chart>
applyScatterChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-scatter-chart id="c"></michi-vz-scatter-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountScatterChart } from "@michi-vz/core";

const chart = mountScatterChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `ScatterChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).
