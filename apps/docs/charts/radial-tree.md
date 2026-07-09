---
title: Radial Tree
description: "A radial cluster()/dendrogram: leaves sit equidistant from the centre, with circles sized at both the group and leaf level. Adaptive label density (abbreviate/truncate/hide/rotate) as the leaf count grows, and an optional word-wrapped centre title. SVG, canvas, and a delegated WebGPU layer."
---
# Radial Tree

<span class="vp-badge tip">Composition</span>

Chart #21 - the last new chart in the sdg-trade migration: a radial cluster()/dendrogram. Migration target for legacy sdg-trade **TreeRadial** - groups fan out from a centre point, each group's leaves sitting on their own radial spoke, every leaf landing at the SAME distance from the centre (a true dendrogram - see [Behaviour notes](#cluster-not-tree) below).

<ChartDemo chart="radial-tree-chart" :legend="[]" />

More leaves push past the adaptive label thresholds - labels abbreviate and rotate radially, then disappear entirely once the tree gets very dense:

<ChartDemo chart="radial-tree-chart" :index="1" :legend="[]" />

> The chart above is the **same engine** in every framework - only the integration code below differs.

## Shape mirrors Treemap

`RadialTreeNode` deliberately mirrors [`TreemapNode`](/charts/treemap)'s shape - `label` / `code` / `value` / `color` / `children` - for API consistency across the two hierarchical charts. A node's colour group is its TOP-LEVEL ancestor's label, exactly like Treemap: a leaf inherits its group's colour unless it (or the group) sets its own `color`.

```ts
import { RadialTreeChart } from "@michi-vz/react";

<RadialTreeChart
  centerLabel="Total Merchandise Trade"
  dataSet={[
    {
      label: "Agriculture",
      children: [
        { label: "Coffee", value: 8 },
        { label: "Tea", value: 5 },
        // ...
      ],
    },
    // ...
  ]}
/>
```

A group's own value is ALWAYS the sum of its children (an explicit `value` on a node with `children` is ignored) - so you only ever supply leaf values.

## Play through the years

Tag every root-level node with a `date` and flip on `timeline`: a year's snapshot is the root nodes sharing that date - children need no dates of their own - and the circles tween between years as they resize. Off by default - nothing changes until a chart opts in. This is interactive year-by-year stepping, not the one-shot entrance further down.

<TimelinePlayDemo chart="radial-tree-chart" />

::: code-group

```tsx [React]
const ref = useRef<RadialTreeChartHandle>(null);

<RadialTreeChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RadialTreeChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:radialTreeChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRadialTreeChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-radial-tree-chart id="c"></michi-vz-radial-tree-chart>
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
- Root nodes without a `date` stay visible in every period.
- `timeline` wins over `progressiveDraw` when both are set - the reveal animation further down stays off while the timeline is in control.

## Reveal animation

The chart wipes in from left to right on mount, revealing its marks in sequence before settling into place. Off by default - a chart opts in with the `progressiveDraw` prop.

<RevealDemo chart="radial-tree-chart" />

`progressiveDraw: true` enables the defaults (1200 ms, easeInOutCubic). A config object tunes it:

::: code-group

```tsx [React]
const ref = useRef<RadialTreeChartHandle>(null);

<RadialTreeChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() re-runs the reveal on demand
```

```vue [Vue]
<RadialTreeChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:radialTreeChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRadialTreeChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-radial-tree-chart id="c"></michi-vz-radial-tree-chart>
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
import { RadialTreeChart } from "@michi-vz/react";

export default () => <RadialTreeChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RadialTreeChart } from "@michi-vz/vue";
</script>

<template>
  <RadialTreeChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { radialTreeChart } from "@michi-vz/svelte";
</script>

<div use:radialTreeChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRadialTreeChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-radial-tree-chart #c></michi-vz-radial-tree-chart>
applyRadialTreeChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-radial-tree-chart id="c"></michi-vz-radial-tree-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountRadialTreeChart } from "@michi-vz/core";

const chart = mountRadialTreeChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props are typed as `RadialTreeChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context).

## Behaviour notes

### cluster(), not tree()

The layout is built with d3-hierarchy's `cluster()` - verified against the legacy chart's exact call - NOT `tree()`. `cluster()` places every LEAF at the same radial distance from the centre regardless of how many levels its branch has, which is what makes this a true dendrogram; `tree()` would instead size each branch by its own subtree depth, and leaves at different depths would land at different radii.

### Dual-level sized circles, one linear scale

Both the GROUP circle (sized by the group's total) and every LEAF circle (sized by its own value) are drawn from the SAME linear scale (verified against the legacy chart's own `scaleLinear` - not a sqrt scale) over the combined domain of every group's AND every leaf's value. `radiusRange` (default `[2, 32]`, the legacy `circleRange`) sets the scale's output range.

### Adaptive label density

Labels react to the total LEAF count via `labelDensityThresholds`:

- Below `rotateAbove` (default 20): every node shows its full name; at low-to-medium density a top-level group's name additionally truncates to 10 characters once the count passes half of `rotateAbove` (a preserved legacy quirk - leaves never truncate this way).
- Past `rotateAbove`: every label abbreviates to 3 letters + "." and rotates radially instead of staying horizontal.
- Past `hideAbove` (default 100): no labels are drawn at all.

### centerLabel word-wrap

`centerLabel` (the legacy `titleCenter`) draws a small circle at the centre (a quarter of the outer radius) with the text word-wrapped to roughly 10 characters per line - a simplified, deterministic port of the legacy pixel-width-aware wrap.

### Links

Each node draws a curved (cubic-bezier) link back to its parent - the dendrogram's radial "spokes" - ported from the legacy chart's control-point formula. Links render as one background layer, so a link never visually covers a circle (a documented, purely cosmetic simplification of the legacy per-node DOM interleaving).

### Nesting deeper than 2 levels

The consumer contract is 2 levels (group + leaf), but deeper nesting is tolerated: every extra level still gets a sized circle and a link, `onDataWarning` flags it (`excess-depth`), and the label-density rules still apply (the depth-1-only truncation rule stops applying below the top level).

### Rendering: SVG, canvas, and a delegated WebGPU

`renderer="svg"` (default) draws one `<circle class="radial-tree-node-circle">` per node. `renderer="canvas"` paints the same marks to a 2D canvas, resolving fill colour through the same consumer-CSS probe every single-mark chart uses. `renderer="webgpu"` **delegates** to the canvas-2D renderer, same rationale as Choropleth Map / Symbol Map: the dendrogram's links are curved bezier paths, so correct GPU tessellation is disproportionate scope here.

### Loading / no-data

`isLoading` and `isNodata` drive the overlay (React: `isLoadingComponent` / `isNodataComponent`), identical to every other chart in the house.

> **Consumer colour authorities:** the context carries `legendData` (`{ label, color, dataLabelSafe }`, one row per top-level group) so a CSS-injection colour system can key per-label rules; `onChartDataProcessed` is only emitted when the context **changes**.
