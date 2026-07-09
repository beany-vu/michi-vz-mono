---
title: Dubbele staven (Tornado)
description: "Dubbele staven (tornado, bevolkingspiramide): twee tegenover elkaar staande waarden verankerd aan een gedeelde middellijn, zodat de onbalans in één oogopslag afleesbaar is."
---
# Dubbele staven (Tornado)

<span class="vp-badge tip">Vergelijking</span>

Welke kant wint, en met hoeveel? Veranker twee tegenover elkaar staande waarden aan een gedeelde middellijn en de onbalans is in één oogopslag afleesbaar - links versus rechts, mannen versus vrouwen, voor versus na. De klassieke bevolkingspiramide en tornado-grafiek, waarbij de langste balk het verhaal vertelt.

<ChartDemo
  chart="dual-horizontal-bar-chart"
  :legend="[
    { label: 'Mannen (rechts, vol)', color: '#3F7CAC' },
    { label: 'Vrouwen (links, licht)', color: '#95b7d1' },
  ]"
/>

> De grafiek hierboven gebruikt in elk framework dezelfde **engine** - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Wanneer asymmetrie het verhaal is.** Bevolkingspiramides, import versus export, promotors versus criticasters: twee tegenover elkaar staande grootheden op één middellijn, en de scheefste kant spreekt als eerste.
- **Directie-samenvattingen op één pagina.** De langste balk en de zwaarste kant communiceren voordat er ook maar één getal wordt gelezen - ideaal wanneer je publiek tien seconden heeft.
- **Staan de twee waarden niet tegenover elkaar** (dit jaar versus vorig jaar, doel versus werkelijk), houd ze dan allebei aan dezelfde kant van nul met een [staafdiagram](/nl/charts/comparable).

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeDual() {
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const base = 2 + Math.random() * 18;
    const skew = (Math.random() - 0.5) * 6;
    dataSet.push({
      label: `Row ${i + 1}`,
      value1: Number(Math.max(0.1, base + skew).toFixed(1)),
      value2: Number(Math.max(0.1, base - skew).toFixed(1)),
      color: "#3F7CAC",
    });
  }
  return {
    dataSet,
    title: "120 diverging rows (synthetic)",
    // Labels in the left margin, clear of the left-extending bars.
    yAxisPosition: "left",
    interactiveRowLabels: true,
    margin: { top: 50, right: 50, bottom: 50, left: 120 },
  };
}
</script>

DualHorizontalBarChart heeft een optionele `renderer="webgpu"` die de value1/value2-balken op de GPU tekent, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo element="michi-vz-dual-horizontal-bar-chart" :make="makeDual" caption="~120 rows" />

## Speel door de jaren heen

Geef elke rij een `date` en zet `timeline` aan: de tornado-grafiek wordt een verhaal per jaar, met een eigen afspeelknop en scrubber die telkens de links/rechts-balans van één periode toont. Standaard uit - zonder opt-in verandert er niets.

<TimelinePlayDemo chart="dual-horizontal-bar-chart" hint="Druk op de afspeelknop onder de grafiek: de data stapt door de jaren, één momentopname per keer. Sleep de scrubber om naar een jaar te springen." />

::: code-group

```tsx [React]
const ref = useRef<DualHorizontalBarChartHandle>(null);

<DualHorizontalBarChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<DualHorizontalBarChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:dualHorizontalBarChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyDualHorizontalBarChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-dual-horizontal-bar-chart id="c"></michi-vz-dual-horizontal-bar-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` bepaalt het tempo, `loop` begint opnieuw, `autoplay: true` start bij mounten, `showControl: false` verbergt de ingebouwde balk.
- Waarden glijden standaard tussen periodes (`interpolate`); stem de beweging af met `tweenMs` en `easing`, of zet `interpolate: false` voor harde overgangen. Met reduced motion is de overgang altijd hard.
- De headless controller is altijd beschikbaar: `chart.timeline()` biedt `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` en `formatPeriod` in de config voor eigen UI.
- Een `filter` (top-N, sortering) blijft binnen elke periode gelden, dus een "top 5 per jaar" werkt meteen.
- Rijen zonder `date` blijven in elke periode zichtbaar.

## Gebruik

::: code-group

```tsx [React]
import { DualHorizontalBarChart } from "@michi-vz/react";

export default () => <DualHorizontalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { DualHorizontalBarChart } from "@michi-vz/vue";
</script>

<template>
  <DualHorizontalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { dualHorizontalBarChart } from "@michi-vz/svelte";
</script>

<div use:dualHorizontalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyDualHorizontalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-dual-horizontal-bar-chart #c></michi-vz-dual-horizontal-bar-chart>
applyDualHorizontalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-dual-horizontal-bar-chart id="c"></michi-vz-dual-horizontal-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountDualHorizontalBarChart } from "@michi-vz/core";

const chart = mountDualHorizontalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props zijn getypeerd als `DualHorizontalBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.
