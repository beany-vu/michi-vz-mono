---
title: Halterdiagram
description: "Halterdiagram: elke rij plaatst zijn onderdelen achter elkaar met een eindkap bij elke stap, zodat het cumulatieve bereik en het aandeel van elk segment in één oogopslag afleesbaar zijn."
---
# Halterdiagram

<span class="vp-badge tip">Samenstelling</span>

Hoe bouwt een lopend totaal zich op, stap voor stap? Elke rij plaatst zijn onderdelen achter elkaar met een eindkap bij elke stap, zodat het cumulatieve bereik en het aandeel van elk segment allebei in één oogopslag afleesbaar zijn.

<ChartDemo chart="bar-bell-chart" />

> De grafiek hierboven gebruikt in elk framework dezelfde **engine** - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Trechters en cumulatieve opbouw.** Hoe de onderdelen zich rij voor rij opstapelen tot een totaal, met een eindkap die elke stap markeert - pijplijnfases, kostenopbouw, kilometeropbouw.
- **Twee doelgroepen, één rij.** De analist leest de bijdrage van elk segment af aan de kappen; de directie leest het uiteindelijke bereik af aan het einde van de rij. Niemand heeft een tweede grafiek nodig.
- **Weegt het vergelijken van hetzelfde segment tussen rijen zwaarder dan het lopende totaal van elke rij**, dan zet het [verticale gestapelde staafdiagram](/nl/charts/vertical-stack-bar) de segmenten voor je op één lijn.

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeBarBell() {
  const keys = ["Asia-Pacific", "Europe", "North America"];
  const colorsMapping = {
    "Asia-Pacific": "#d62728",
    "Europe": "#2ca02c",
    "North America": "#1f77b4",
  };
  const dataSet = [];
  let asia = 40, europe = 20, america = 10;
  for (let i = 0; i < 120; i++) {
    asia += Math.random() * 12;
    europe += Math.random() * 6;
    america += Math.random() * 4;
    dataSet.push({
      date: String(2000 + i),
      "Asia-Pacific": Math.round(asia),
      "Europe": Math.round(europe),
      "North America": Math.round(america),
    });
  }
  return { dataSet, keys, colorsMapping };
}
</script>

BarBellChart heeft een optionele `renderer="webgpu"` die de segmentbalken en eindkapcirkels tekent als GPU-instanced marks, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo legend element="michi-vz-bar-bell-chart" :make="makeBarBell" caption="~120 rows" />

## Speel door de jaren heen

BarBellChart gebruikt `date` al voor de categorie van de rij (de band op de y-as), dus de timeline-tag heet in plaats daarvan `period`. Geef elke rij een `period` en zet `timeline` aan: de momentopname van een jaar bestaat uit de rijen die die period delen, en de lengte van elk segment glijdt tussen jaren. Standaard uit - zonder opt-in verandert er niets. Dit is interactief jaar-voor-jaar stappen, niet de eenmalige intro verderop.

```ts
{ period: "2021", date: "Kenya", exports: 40, domestic: 25 }
```

<TimelinePlayDemo chart="bar-bell-chart" hint="Druk op de afspeelknop onder de grafiek: de data stapt door de jaren, één momentopname per keer. Sleep de scrubber om naar een jaar te springen." />

::: code-group

```tsx [React]
const ref = useRef<BarBellChartHandle>(null);

<BarBellChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<BarBellChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:barBellChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyBarBellChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
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
- Rijen zonder `period` blijven in elke periode zichtbaar.
- `timeline` wint het van `progressiveDraw` als beide zijn ingesteld - de onthulanimatie verderop blijft uit zolang de timeline de regie heeft.

## Onthulanimatie

De grafiek tekent zichzelf van links naar rechts bij het mounten, waarbij de elementen na elkaar verschijnen voordat ze op hun plek vallen. Standaard uit - een grafiek kiest ervoor met de `progressiveDraw`-prop.

<RevealDemo chart="bar-bell-chart" replay-label="Animatie opnieuw afspelen" hint="Elke lijn groeit van het eerste naar het laatste jaar; het label volgt de punt en komt tot stilstand bij het lijneinde. Met reduced motion ingeschakeld verschijnt de grafiek meteen volledig getekend." />

`progressiveDraw: true` gebruikt de standaardinstellingen (1200 ms, easeInOutCubic). Een configuratieobject verfijnt het gedrag:

::: code-group

```tsx [React]
const ref = useRef<BarBellChartHandle>(null);

<BarBellChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() speelt de animatie opnieuw af
```

```vue [Vue]
<BarBellChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:barBellChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyBarBellChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
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
import { BarBellChart } from "@michi-vz/react";

export default () => <BarBellChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { BarBellChart } from "@michi-vz/vue";
</script>

<template>
  <BarBellChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { barBellChart } from "@michi-vz/svelte";
</script>

<div use:barBellChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyBarBellChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-bar-bell-chart #c></michi-vz-bar-bell-chart>
applyBarBellChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountBarBellChart } from "@michi-vz/core";

const chart = mountBarBellChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props zijn getypeerd als `BarBellChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.
