---
title: Fountain (Jet d'Eau)
---
# Fountain (Jet d'Eau)

<span class="vp-badge warning">Experimental</span> <span class="vp-badge tip">Comparison</span>

::: warning Experimental - not yet stable
Unlike the other 16 charts (which are stable), the Fountain chart is **experimental**: its API, visuals, and `ChartContext` shape may change in future releases. It is a storytelling / communication mark, not a precision analysis tool - see [When it earns its place](#when-the-fountain-earns-its-place). Pin a version if you depend on it.
:::

Geneva pumps 500 litres a second into the sky. You photograph the jet. You never photograph the tonnes of water falling back unseen - the spray the column is actually made of. **Most numbers are shaped like that: a bright visible peak, standing on a hidden mass nobody credits.** The Fountain chart draws both at once - the headline you report, and the thing quietly eroding it (or holding it up).

- **The spike apex is the number** - read it off the y-axis, precisely. It's the strongest channel a chart has.
- **The spray is a flag, not a ruler** - "this one is bleeding / this one is shaky." The *exact* second figure lives on the tooltip and in `getContext()` (`spreadRatio`), never measured off the plume's width.

So it is an honest **storytelling and attribution** chart: revenue booked vs revenue leaking, sales secured vs shrink, the stars you see vs the maintainers you don't. It is not a precision analysis tool - for that, reach for [Fan](/charts/fan) (uncertainty bands), [Vertical Stack Bar](/charts/vertical-stack-bar) (sortable secured + at-risk), or a waterfall. See [When it earns its place](#when-the-fountain-earns-its-place).

The default `style: "jet"` is the faithful Jet d'Eau: a tall, narrow column, dense at the base, fraying into a soft crown that drifts downwind. A more symmetric `style: "plume"` (an upright column with a feathery bloom and a mist skirt) is also available - see [Two silhouettes](#two-silhouettes).

<ChartDemo chart="fountain-chart" />

> One chart, two modes - decided by the x-axis type. Set `xAxisDataType: "band"` for **Snapshot mode**: one jet per category, comparing magnitudes side by side (fountains, cities, products). Use a temporal or numeric x (`"date_annual"`, `"date_monthly"`, `"number"`) for **Trend mode**: a jet per period, the rising apexes trace the trend while each plume shows that period's volatility, and a forecast jet renders dashed with a wider, frothier crown.

## Usage

::: code-group

```tsx [React]
import { FountainChart } from "@michi-vz/react";

export default () => <FountainChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { FountainChart } from "@michi-vz/vue";
</script>

<template>
  <FountainChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { fountainChart } from "@michi-vz/svelte";
</script>

<div use:fountainChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyFountainChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-fountain-chart #c></michi-vz-fountain-chart>
applyFountainChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, …
</script>
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Snapshot mode (categorical x)

Pass `xAxisDataType: "band"` (or omit it; "band" is the default). Each `dataSet` item becomes one jet, placed in its own x-band. This is the comparison mode: heights answer "which is bigger?" and plume widths answer "which is most uncertain?"

```ts
const props = {
  xAxisDataType: "band",
  dataSet: [
    { label: "Jet d'Eau",    value: 140, spread: 20 },
    { label: "King Fahd",    value: 312, spread: 35 },
    { label: "World Cup",    value: 185, spread: 15 },
    { label: "Bellagio",     value:  84, spread:  8 },
  ],
};
```

## Trend mode (temporal or numeric x)

Provide a temporal or numeric `xAxisDataType` and supply a `date` on each item. The jets are laid out along the time axis; a trend line threads their apexes. A `predicted: true` item renders dashed with a visibly frothier plume - the forecast look.

```ts
const props = {
  xAxisDataType: "date_annual",
  dataSet: [
    { label: "2020", date: 2020, value: 42, spread:  5 },
    { label: "2021", date: 2021, value: 51, spread:  6 },
    { label: "2022", date: 2022, value: 63, spread:  8 },
    { label: "2023", date: 2023, value: 70, spread: 10 },
    { label: "2024", date: 2024, value: 78, spread: 14, predicted: true },
    { label: "2025", date: 2025, value: 85, spread: 20, predicted: true },
  ],
};
```

::: warning Best for 5-12 periods in trend mode
With many data points the jets compress and the chart reads like a decorated line chart - the plume detail is lost. For dense time series (20+ periods), prefer the [Fan chart](/charts/fan) which encodes uncertainty as smooth confidence bands. The Fountain shines at human scale: a handful of periods where each plume can breathe.
:::

## Two silhouettes

Set `style` to pick the shape; both encode the same data (apex = `value`, spread channel = `spread`).

- **`style: "jet"` (default)** - the faithful Jet d'Eau: a tall, narrow column, dense and opaque at the base, **fraying into a soft, translucent crown** at the top (built from graduated-opacity layers; the crown width grows with `spread`, the layer count with the optional `density`). `lean` (in [-1, 1]) makes the crown **drift downwind**. Iconic; best as a headline/KPI or a comparison.
- **`style: "plume"`** - a symmetric column blooming into a feathery crown: `frothLayers` graduated-opacity slices at the apex, a soft `showMist` skirt, and `showDroplets` ballistic arcs. `stemFraction` and `bloomExponent` tune the column-to-crown profile. Cleaner for a single KPI where the spread reads as a confidence halo.

```ts
const props = { style: "plume", dataSet: [{ label: "Q4", value: 78, spread: 20 }] };
```

Both styles share `stemFraction` (column base half-width as a fraction of the slot), the `density` field, and `lean`. Colours follow your data/`colorsMapping`; the froth/spray only modulate opacity of your hue, so the chart adapts to light and dark themes.

## When the Fountain earns its place

We checked the literature before shipping this. The Jet d'Eau metaphor is novel in dataviz (no prior fountain/jet chart exists), and the underlying idea is a sound re-orientation of the raincloud / violin / density-strip family. But its honest job is **communication, not measurement** - so use it where a memorable headline-plus-its-hidden-half matters, and reach for a precision chart when you need to compare the second number exactly.

**Strong fits**

- **Headline vs hidden erosion.** Revenue booked vs leaking (the gross-to-net retention gap), sales secured vs shrink, capacity vs losses. One mark says "this is the number, and this is what's bleeding out from under it." This is its flagship use.
- **High-but-shaky / pushed-high.** A bar shows the level; the spray adds "and here's how fragile it is."
- **"What you see vs what it took"** storytelling - the visible win and the invisible work behind it. It wins on recognition and recall (the one thing the embellishment research backs).

**Use it honestly**

- **The apex is the only thing readers measure.** Put the headline number there, on a real labelled y-axis. Width and area are low-accuracy channels (people underestimate them), so never ask anyone to compare spray widths.
- **The spray is a flag; the figure is text.** Surface the exact second number on the tooltip / legend / `getContext().jets[].spreadRatio`, and ground it in a stated threshold (shrink > 2%, NRR < 100%, non-revenue water > 20%, P10-P90).
- **Lead with snapshot mode**; cap trend mode at a handful of periods. For dense or precise uncertainty work, prefer [Fan](/charts/fan) (bands), [Vertical Stack Bar](/charts/vertical-stack-bar) (sortable secured + at-risk), or a waterfall.
- Keep it to **5-12 glyphs** and sort snapshots by `spreadRatio` so the frothiest item is easy to find.

## API

Props are typed as `FountainChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg" | "canvas"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context). Full reference: [Fountain API](/api/fountain).
