---
title: Fountain (Jet d'Eau)
description: "Fountain (Jet d'Eau) chart, the michi-vz signature chart inspired by Geneva's fountain: one chart with snapshot and trend modes. Experimental."
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

<ChartDemo chart="fountain-chart" :legend="false" />

## Anatomy: how to read a fountain

Every visible part of the glyph has one stated meaning. Nothing else carries data.

- **Apex** - THE number. It sits on a real, labelled y-axis and it is the only thing you measure.
- **Stem** - the body of the number. Decorative; its width never encodes anything.
- **Crown / froth** - the flag: "this one is shaky / this one is bleeding." Wide and frothy means look closer; the exact second figure lives on the tooltip and in `getContext().jets[].spreadRatio`, never in the width you see.
- **Symmetric vs leaning crown** - symmetry is a signal. An upright crown says the spread is balanced (it could swing either way). A leaning crown says the hidden mass hangs on one side - a late tail, downside-heavy risk. Read only the direction; the skew figure is on the tooltip (`jets[].lean`).
- **The wind** - a jet that encodes no `lean` still drifts gently to one side. That shared drift is the Jet d'Eau signature (wind over the lake), purely decorative: every such jet drifts the same way, and `lean` is `null` in the context.
- **Droplets and mist** (plume style) - decoration; the droplet count scales with the optional `density` field.

> One chart, two modes - decided by the x-axis type. Set `xAxisDataType: "band"` for **Snapshot mode**: one jet per category, comparing magnitudes side by side (fountains, cities, products). Use a temporal or numeric x (`"date_annual"`, `"date_monthly"`, `"number"`) for **Trend mode**: a jet per period, the rising apexes trace the trend while each plume shows that period's volatility, and a forecast jet renders dashed with a wider, frothier crown.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

<script setup>
function makeFountain() {
  const dataSet = [];
  for (let i = 0; i < 400; i++) {
    const base = 40 + 60 * Math.sin(i / 11) + 20 * Math.sin(i / 3.3);
    const value = Math.max(5, Math.round(base + (i % 7) * 2));
    const spread = Math.max(1, Math.round(4 + 18 * Math.abs(Math.sin(i / 5)) + (i % 5)));
    const density = Math.min(1, 0.15 + (spread / 40));
    dataSet.push({
      label: `Jet ${i + 1}`,
      value,
      spread,
      density,
      ...(i % 47 === 0 ? { color: "#D4AF37" } : {}),
    });
  }
  return { dataSet, xAxisDataType: "band" };
}
</script>

FountainChart has an opt-in `renderer="webgpu"` that paints each jet's column and frayed plume as GPU-instanced marks while axes, labels and tooltips stay on the SVG layer. It is capability-gated: on a browser without WebGPU it downgrades to canvas automatically, and `getContext().renderer` reports whichever actually painted. The shared sideways drift you see across the jets is the decorative wind (none of these items encode a `lean`), not data.

<WebgpuHeavyDemo element="michi-vz-fountain-chart" :make="makeFountain" caption="400 jets" />

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

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

## Field guide: ways to read a fountain

The fountain is new, so here is the full repertoire - each demo is a real, live chart with an honest caption. The first four are the flagship reads (the headline and what is quietly eroding or carrying it); the rest generalize the same grammar to certainty, stability, risk, AI and audiences.

### Sales secured vs shrink

Three stores post near-identical sales, so a bar chart would call them equal. The fat, dense plume on Store C flags where theft and spoilage are eroding margin, and where to send loss-prevention first. The shrink percentage lives on the tooltip; over 2% of sales is the alert threshold.

<ChartDemo chart="fountain-chart" :index="1" :legend="false" />

### Delivered vs never billed (trend)

Trend mode: volume delivered keeps climbing, but the widening plume warns that a growing share never gets billed - leaks and unmetered use outpacing growth. Under 10% non-revenue water is good; over 20% means act.

<ChartDemo chart="fountain-chart" :index="2" :legend="false" />

### A forecast that is high but shaky

The trend rises, but the forecast jets fray into dashed froth: growth is projected, and the confidence behind it is thinning fast. For precise bands, the [Fan chart](/charts/fan) is the right tool; this is the memorable version of the same warning.

<ChartDemo chart="fountain-chart" :index="3" :legend="false" />

### The stars you see, the maintainers you don't

The hook the chart was built for: the spike is what everyone sees and stars; the spray is the invisible contributors the project actually rests on. Similar fame, very different foundations. Storytelling, not measurement.

<ChartDemo chart="fountain-chart" :index="4" :legend="false" />

### Same number, three certainties

Three teams estimate the same 72 days to launch. Identical apexes; only the plume separates the team that measured from the team that guessed. The flag says the 72 is soft - the exact range belongs on the tooltip, and real confidence intervals belong to the [Fan chart](/charts/fan).

<ChartDemo chart="fountain-chart" :index="6" :legend="false" />

### Stable or shaky

Two services average 120 ms and two average 60 ms - a bar chart shows two pairs of twins. The plume splits each pair: the tight crown is the one you can put an SLO on. Lower apex is better here; say so in the caption when you use it. The same read works for profit vs volatility.

<ChartDemo chart="fountain-chart" :index="7" :legend="false" />

### Expected loss vs the worst case

The apex is the expected loss; the crown reaches toward the stress-case (`value + spread`, the `upperBound` in `getContext()`). Two positions expect the same loss; one hides a far heavier tail. Read the worst-case number off the tooltip, never off the width.

<ChartDemo chart="fountain-chart" :index="8" :legend="false" />

### AI answers: confident or guessing

The apex is the answer score; the plume is the model's own uncertainty, normalised into score units so both share the y-axis. Tight crown: safe to automate. Fraying crown: hand it to a human. The [insights layer](/guide/insights) reads the same `spreadRatio` out of `getContext()` to narrate which answers to trust.

<ChartDemo chart="fountain-chart" :index="9" :legend="false" />

### Same average, divided audience

Two articles average the same 5.5 minutes of engagement. One holds everyone for about that long; the other splits its readers between skimmers and devourers. The average hides the division; the plume flags it, and the flag is your cue to segment before concluding anything.

<ChartDemo chart="fountain-chart" :index="10" :legend="false" />

### Which side does the risk hang on

Symmetry as a signal: three routes share the same median and the same spread, but one crown leans - its surprises are one-sided, a late tail (`lean: 0.8`). Upright (`lean: 0`) means balanced; leaning means the hidden mass hangs on that side. Read only the direction, never the angle.

<ChartDemo chart="fountain-chart" :index="11" :legend="false" />

### Typhoons over the Philippines

Sometimes the lean is literal. Each jet is a typhoon: the apex its peak sustained winds, the spray reaching toward the gusts (same km/h), the froth thickness its wind-field size, and the crown leaning the way the storm travelled - Pacific typhoons cross the Philippines east to west, so the whole line leans left, and the one that recurved toward Japan leans the other way. One glyph, four honest channels, zero new chart types.

<ChartDemo chart="fountain-chart" :index="12" :legend="false" />

## Two silhouettes

Set `style` to pick the shape; both encode the same data (apex = `value`, spread channel = `spread`).

- **`style: "jet"` (default)** - the faithful Jet d'Eau: a tall, narrow column, dense and opaque at the base, **fraying into a soft, translucent crown** at the top (built from graduated-opacity layers; the crown width grows with `spread`, the layer count with the optional `density`). `lean` (in [-1, 1]) makes the crown **drift downwind**. Iconic; best as a headline/KPI or a comparison.
- **`style: "plume"`** - a symmetric column blooming into a feathery crown: `frothLayers` graduated-opacity slices at the apex, a soft `showMist` skirt, and `showDroplets` ballistic arcs. `stemFraction` and `bloomExponent` tune the column-to-crown profile. Cleaner for a single KPI where the spread reads as a confidence halo.

```ts
const props = { style: "plume", dataSet: [{ label: "Q4", value: 78, spread: 20 }] };
```

<ChartDemo chart="fountain-chart" :index="5" :legend="false" />

**Rule of thumb: plume for few jets, jet for the hero and for heavy data.** At human scale (1 to 12 jets) the plume's symmetric layered crown is the easiest shape to read the symptom from - tight halo vs wide froth. At hundreds of jets the plume's bloom gets clamped to a sliver of the slot and it degrades into a plain bar, while the stem-dominant jet degrades gracefully into a tall strip (see the heavy-data demo above); it also carries the brand. For genuinely dense series, stop decorating and reach for the [Fan chart](/charts/fan).

**Symmetry carries meaning.** An upright crown (the plume style, or a jet with `lean: 0`) says the spread is balanced. A leaning crown (`lean` in [-1, 1], sign only) says the spread hangs on one side. A jet with **no** `lean` keeps a gentle decorative drift - the Geneva wind - and reports `lean: null` in the context, so consumers can tell flag from flourish.

Both styles share `stemFraction` (column base half-width as a fraction of the slot), the `density` field, and `lean`. Colours follow your data/`colorsMapping`; the froth/spray only modulate opacity of your hue, so the chart adapts to light and dark themes.

## When the Fountain earns its place

The literature was checked before this chart shipped. The Jet d'Eau metaphor is novel in dataviz (no prior fountain/jet chart exists), and the underlying idea is a sound re-orientation of the raincloud / violin / density-strip family. But its honest job is **communication, not measurement** - so use it where a memorable headline-plus-its-hidden-half matters, and reach for a precision chart when you need to compare the second number exactly.

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

Props are typed as `FountainChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context). Full reference: [Fountain API](/api/fountain).
