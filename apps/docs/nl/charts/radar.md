---
title: Radardiagram
description: "Radardiagram voor het vergelijken van opties op basis van gedeelde criteria: elke kandidaat wordt een veelhoek waarvan de pieken en dalen sterktes en zwaktes in één oogopslag tonen."
---
# Radardiagram

<span class="vp-badge tip">Vergelijking</span>

Welke optie wint, en waar? Leg een paar kandidaten over dezelfde set criteria en elk wordt een veelhoek die je in één oogopslag kunt lezen - de pieken tonen elke sterkte, de dalen tonen elke zwakte, en de overlappingen tonen precies waar ze van plaats wisselen.

<ChartDemo chart="radar-chart" />

> De grafiek hierboven is dezelfde **engine** in elk framework - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Scorekaarten.** Leveranciersevaluaties, kandidaatbeoordelingen, productbenchmarks: een paar opties over dezelfde criteria, elk een veelhoek waarvan de pieken en dalen de sterktes en zwaktes zijn.
- **Balans versus specialisatie.** Een rondere veelhoek is de allrounder; een puntige zet alles op twee assen. Dat vormverhaal is wat tabellen niet kunnen vertellen.
- **Houd het bij een paar entiteiten en 5 tot 12 assen.** Voor een precieze vergelijking op één criterium leest een [staafdiagram](/nl/charts/comparable) de exacte waarden af; de radar leest profielen.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeRadar() {
  const axes = [
    "Healthcare", "Education", "Cost of living", "Safety",
    "Environment", "Culture", "Infrastructure", "Climate",
    "Jobs", "Nightlife", "Walkability", "Diversity",
  ];
  const palette = ["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e"];
  const names = ["Vienna", "Singapore", "Lisbon", "Auckland"];
  const series = names.map((label, i) => ({
    label,
    color: palette[i],
    values: axes.map(() => Math.round(20 + Math.random() * 80)),
  }));
  return { axes, series, maxValue: 100, fillOpacity: 0.2 };
}
</script>

RadarChart heeft een optionele `renderer="webgpu"` die de veelhoekvullingen en polmarkers tekent als GPU-instanced marks, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU wordt automatisch teruggevallen op canvas, en `getContext().renderer` rapporteert wat daadwerkelijk is getekend.

<WebgpuHeavyDemo legend element="michi-vz-radar-chart" :make="makeRadar" caption="12 axes × 4 series" />

## Speel door de jaren heen

RadarChart gebruikt `date` al voor de legacy vorm per as `{ date, value }`, dus de timeline-tag heet in plaats daarvan `period`. Geef elke serie-rij een `period` en zet `timeline` aan: de momentopname van een jaar bestaat uit de rijen die die period delen, en elke veelhoek glijdt tussen jaren. Standaard uit - zonder opt-in verandert er niets. Dit is interactief jaar-voor-jaar stappen, niet de eenmalige intro verderop.

```ts
{ label: "Vienna", period: "2021", values: [72, 65, 40, 88 /* … */] }
```

<TimelinePlayDemo chart="radar-chart" hint="Druk op de afspeelknop onder de grafiek: de data stapt door de jaren, één momentopname per keer. Sleep de scrubber om naar een jaar te springen." />

::: code-group

```tsx [React]
const ref = useRef<RadarChartHandle>(null);

<RadarChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RadarChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:radarChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRadarChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
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
- Series zonder `period` blijven in elke periode zichtbaar.
- `timeline` wint het van `progressiveDraw` als beide zijn ingesteld - de onthulanimatie verderop blijft uit zolang de timeline de regie heeft.

## Onthulanimatie

De grafiek tekent zichzelf van links naar rechts bij het mounten, waarbij de elementen na elkaar verschijnen voordat ze op hun plek vallen. Standaard uit - een grafiek kiest ervoor met de `progressiveDraw`-prop.

<RevealDemo chart="radar-chart" replay-label="Animatie opnieuw afspelen" hint="Elke lijn groeit van het eerste naar het laatste jaar; het label volgt de punt en komt tot stilstand bij het lijneinde. Met reduced motion ingeschakeld verschijnt de grafiek meteen volledig getekend." />

`progressiveDraw: true` gebruikt de standaardinstellingen (1200 ms, easeInOutCubic). Een configuratieobject verfijnt het gedrag:

::: code-group

```tsx [React]
const ref = useRef<RadarChartHandle>(null);

<RadarChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() speelt de animatie opnieuw af
```

```vue [Vue]
<RadarChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:radarChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRadarChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
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
- Onthulanimatie is een eenmalige animatie bij mounten; speel door de jaren hierboven stapt in plaats daarvan jaar voor jaar door de data.

## Gebruik

::: code-group

```tsx [React]
import { RadarChart } from "@michi-vz/react";

export default () => <RadarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RadarChart } from "@michi-vz/vue";
</script>

<template>
  <RadarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { radarChart } from "@michi-vz/svelte";
</script>

<div use:radarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRadarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-radar-chart #c></michi-vz-radar-chart>
applyRadarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props zijn getypeerd als `RadarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-agnostische [ChartContext](/nl/guide/llm-context).
