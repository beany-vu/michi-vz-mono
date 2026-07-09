---
title: Bereikdiagram
description: "Bereikdiagram: arceert de volledige spreiding per reeks (beste tot slechtste geval, prognosekegels, percentielbanden) zodat onzekerheid iets is dat lezers kunnen zien."
---
# Bereikdiagram

<span class="vp-badge tip">Trends</span>

"Hoe breed is de spreiding?" Wanneer een enkele lijn een vertekend beeld van je data geeft, teken dan de band in plaats daarvan. Beste geval tot slechtste geval, de prognosekegel, het 5e-tot-95e percentiel - dit arceert het volledige bereik per reeks zodat onzekerheid iets is wat de lezer kan zien, niet naar hoeft te raden.

<ChartDemo chart="range-chart" />

> De grafiek hierboven is dezelfde **engine** in elk framework - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Wanneer een enkele lijn je zekerheid zou overdrijven.** Prognosekegels, 5e-tot-95e-percentielbanden, best-tot-slechtste scenario's: de breedte van de band is het eerlijke antwoord.
- **Volatiliteit tussen reeksen vergelijken.** Een brede band naast een smalle is een risicoverhaal dat geen gemiddelde overbrengt - portefeuillespreiding, SLA-jitter, temperatuurbereiken.
- **Geneste betrouwbaarheidsniveaus rond één prognose?** Precies dat stelt het [waaierdiagram](/nl/charts/fan) voor je samen, banden en mediaan in één aanroep.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

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

RangeChart heeft een optionele `renderer="webgpu"` die de min/max-banden tekent als GPU-instanced geometrie, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU wordt automatisch teruggevallen op canvas, en `getContext().renderer` rapporteert wat daadwerkelijk is getekend.

<WebgpuHeavyDemo legend element="michi-vz-range-chart" :make="makeRange" caption="~200 bands" />

## Onthulanimatie

De grafiek tekent zichzelf van links naar rechts bij het mounten, waarbij de elementen na elkaar verschijnen voordat ze op hun plek vallen. Standaard uit - een grafiek kiest ervoor met de `progressiveDraw`-prop.

<RevealDemo chart="range-chart" replay-label="Animatie opnieuw afspelen" hint="Elke lijn groeit van het eerste naar het laatste jaar; het label volgt de punt en komt tot stilstand bij het lijneinde. Met reduced motion ingeschakeld verschijnt de grafiek meteen volledig getekend." />

`progressiveDraw: true` gebruikt de standaardinstellingen (1200 ms, easeInOutCubic). Een configuratieobject verfijnt het gedrag:

::: code-group

```tsx [React]
const ref = useRef<RangeChartHandle>(null);

<RangeChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() speelt de animatie opnieuw af
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
  // el.replay() speelt de animatie opnieuw af
</script>
```

:::

- `durationMs` en `easing` ("linear", "easeOutQuad", "easeInOutCubic", of een eigen `(t) => t`-functie) bepalen het tempo.
- `autoplay: false` rendert de grafiek volledig getekend; roep `replay()` aan (React-ref-handle, webcomponent-methode of de core-instantie) om de animatie op aanvraag te starten. `replayOnUpdate: true` herhaalt de animatie bij elke datawijziging.
- Respecteert `prefers-reduced-motion`: de grafiek verschijnt dan meteen volledig getekend.

## Speel door de jaren heen

De data beslaat al meerdere jaren, dus er is niets te taggen. Zet `timeline` aan: de eigen afspeelknop en scrubber van de grafiek stappen door die jaren - bij elke stap tekenen de banden zich alleen tot het actieve jaar, en tijdens het afspelen lopen ze vloeiend verder door. Scrub je terug, dan trekken de banden zich weer terug. Hoveren toont alleen wat al echt getekend is. Standaard uit - zonder opt-in verandert er niets.

<TimelinePlayDemo chart="range-chart" hint="Druk op de afspeelknop onder de grafiek: de grafiek tekent zich verder door tot elk jaar terwijl hij speelt. Sleep de scrubber om naar een jaar te springen." />

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

- `speedMs` bepaalt het tempo, `loop` begint opnieuw, `autoplay: true` start bij mounten, `showControl: false` verbergt de ingebouwde balk.
- De headless controller is altijd beschikbaar: `chart.timeline()` biedt `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` en `formatPeriod` in de config voor eigen UI.
- Waarden glijden standaard tussen jaren (`interpolate`); zet `interpolate: false` voor harde overgangen. Met reduced motion is de overgang altijd hard.
- `timeline` wint het van `progressiveDraw` wanneer beide op dezelfde grafiek staan.

## Gebruik

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

Props zijn getypeerd als `RangeChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-agnostische [ChartContext](/nl/guide/llm-context).
