---
title: Treemap
description: "Treemap with tiles sized by total and an optional two-part split showing realized vs untapped share; nests under groups and folds to a stack on narrow screens."
---
# Treemap

<span class="vp-badge tip">Composition</span>

"Which parts are biggest, and how much of each is already realized?" A treemap answers both at once: every tile is sized by its total, and an optional **two-part split** fills the solid share inside each tile - so you read magnitude (area) and progress (the split) in one glance. The classic case is export potential: tile area = total potential, the solid part = **realized**, the lighter part = **untapped**. Tiles can nest under groups, and on a narrow screen the whole thing folds into a readable single-column **stack**.

<ChartDemo chart="treemap-chart" :legend="[]" />

Prefer a flat list (one tile per product, each its own colour - the classic export-potential layout)? Drop the `children` nesting and pass leaves directly:

<ChartDemo chart="treemap-chart" :index="1" :legend="[]" />

> The split is generic. Name the two parts with `splitLabels` - `["Realized", "Untapped"]`, `["Used", "Free"]`, `["Done", "Remaining"]` - nothing in the engine hardcodes a domain.

## When to reach for it

- **Portfolio views.** Hundreds of products, sectors or cost centres on one screen: area is size, the split is progress, and the whole hierarchy fits without scrolling.
- **"Where should we focus?"** The big, mostly-untapped tiles are the opportunity list, no sorting required - the classic export-potential and market-scan read.
- **A dozen flat categories or fewer?** A [bar](/charts/comparable) or [Pie](/charts/pie) reads exact values faster than tile areas; the treemap earns its place at scale.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeTreemap() {
  const sectors = [
    { label: "Industry", color: "#1d3557" },
    { label: "Agri-food", color: "#e9c46a" },
    { label: "Materials", color: "#2a9d8f" },
    { label: "Textiles", color: "#e63946" },
    { label: "Pharmaceuticals", color: "#457b9d" },
    { label: "Energy", color: "#f4a261" },
    { label: "Electronics", color: "#9b5de5" },
    { label: "Services", color: "#06d6a0" },
  ];
  const dataSet = sectors.map((sector, si) => {
    const children = [];
    for (let i = 0; i < 50; i++) {
      const value = 5 + Math.round(Math.random() * 120);
      const partial = Math.round(Math.random() * value);
      children.push({
        label: `${sector.label} product ${si * 50 + i + 1}`,
        value,
        partial,
      });
    }
    return { label: sector.label, color: sector.color, children };
  });
  return { splitLabels: ["Realized", "Untapped"], showLegend: true, layout: "squarify", dataSet };
}
</script>

TreemapChart has an opt-in `renderer="webgpu"` that paints the tiles as GPU-instanced rectangles while labels, tooltips and the split fill stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted.

<WebgpuHeavyDemo legend element="michi-vz-treemap-chart" :make="makeTreemap" caption="~400 tiles" />

## Play through the years

Tag every root-level tile with a `date` and flip on `timeline`: a year's snapshot is the root tiles sharing that date - children need no dates of their own - and the tiles tween between years as they resize. Off by default - nothing changes until a chart opts in. This is interactive year-by-year stepping, not the one-shot entrance further down.

<TimelinePlayDemo chart="treemap-chart" />

::: code-group

```tsx [React]
const ref = useRef<TreemapChartHandle>(null);

<TreemapChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<TreemapChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:treemapChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyTreemapChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-treemap-chart id="c"></michi-vz-treemap-chart>
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
- Root tiles without a `date` stay visible in every period.
- `timeline` wins over `progressiveDraw` when both are set - the reveal animation further down stays off while the timeline is in control.

## Reveal animation

The chart wipes in from left to right on mount, revealing its marks in sequence before settling into place. Off by default - a chart opts in with the `progressiveDraw` prop.

<RevealDemo chart="treemap-chart" />

`progressiveDraw: true` enables the defaults (1200 ms, easeInOutCubic). A config object tunes it:

::: code-group

```tsx [React]
const ref = useRef<TreemapChartHandle>(null);

<TreemapChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() re-runs the reveal on demand
```

```vue [Vue]
<TreemapChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:treemapChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyTreemapChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-treemap-chart id="c"></michi-vz-treemap-chart>
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
import { TreemapChart } from "@michi-vz/react";

export default () => <TreemapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { TreemapChart } from "@michi-vz/vue";
</script>

<template>
  <TreemapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { treemapChart } from "@michi-vz/svelte";
</script>

<div use:treemapChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyTreemapChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-treemap-chart #c></michi-vz-treemap-chart>
applyTreemapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-treemap-chart id="c"></michi-vz-treemap-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, splitLabels, …
</script>
```

```ts [Vanilla JS]
import { mountTreemapChart } from "@michi-vz/core";

const chart = mountTreemapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Data shape

Each `dataSet` node is a leaf (`value`, optional `partial`) or a parent (`children`). A parent's value is the sum of its leaves.

```ts
const props = {
  splitLabels: ["Realized", "Untapped"],
  showLegend: true,
  layout: "auto", // squarify on desktop, stack on narrow screens
  dataSet: [
    { label: "Agri-food", children: [
      { label: "Fruits", value: 100, partial: 34 },   // 34% realized
      { label: "Beverages", value: 50, partial: 35 }, // 70% realized
    ]},
    { label: "Industry", children: [
      { label: "Machinery", value: 120, partial: 64 },
    ]},
  ],
};
```

## Responsive layout

`layout` picks the tiling algorithm: `"squarify"` (the treemap), `"stack"` (a single-column vertical partition - full-width rows, height proportional to value, with the same in-row split), or `"auto"` (switches to stack below `stackBreakpoint`, default 480px). The split, labels, tooltip, `getContext()` and SVG/canvas parity are identical across both layouts.

## API

Props are typed as `TreemapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context). Full reference: [Treemap API](/api/treemap).
