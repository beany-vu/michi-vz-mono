---
title: Treemap
description: "Treemap met tegels geschaald op totaal en een optionele tweedelige splitsing die gerealiseerd versus onbenut aandeel toont; nestelt onder groepen en vouwt op smalle schermen tot een stapel."
---
# Treemap

<span class="vp-badge tip">Samenstelling</span>

"Welke onderdelen zijn het grootst, en hoeveel daarvan is al gerealiseerd?" Een treemap beantwoordt beide tegelijk: elke tegel is geschaald op zijn totaal, en een optionele **tweedelige splitsing** vult het solide aandeel binnen elke tegel - zodat je omvang (oppervlakte) en voortgang (de splitsing) in één oogopslag leest. Het klassieke voorbeeld is exportpotentieel: tegeloppervlakte = totaal potentieel, het solide deel = **gerealiseerd**, het lichtere deel = **onbenut**. Tegels kunnen onder groepen nestelen, en op een smal scherm vouwt het geheel om tot een leesbare **stapel** in één kolom.

<ChartDemo chart="treemap-chart" :legend="[]" />

Liever een platte lijst (één tegel per product, elk zijn eigen kleur - de klassieke exportpotentieel-indeling)? Laat de `children`-nesting weg en geef de bladeren direct door:

<ChartDemo chart="treemap-chart" :index="1" :legend="[]" />

> De splitsing is generiek. Benoem de twee delen met `splitLabels` - `["Realized", "Untapped"]`, `["Used", "Free"]`, `["Done", "Remaining"]` - niets in de engine legt een domein hard vast.

## Wanneer kies je deze

- **Portefeuilleoverzichten.** Honderden producten, sectoren of kostenplaatsen op één scherm: oppervlakte is grootte, de splitsing is voortgang, en de hele hiërarchie past zonder scrollen.
- **"Waar moeten we ons op focussen?"** De grote, grotendeels onbenutte tegels vormen de kansenlijst, zonder dat er gesorteerd hoeft te worden - de klassieke lezing voor exportpotentieel en marktscans.
- **Een dozijn platte categorieën of minder?** Een [staafdiagram](/nl/charts/comparable) of [cirkeldiagram](/nl/charts/pie) leest exacte waarden sneller af dan tegeloppervlaktes; de treemap verdient haar plek pas op schaal.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

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

TreemapChart heeft een optionele `renderer="webgpu"` die de tegels tekent als GPU-instanced rechthoeken, terwijl labels, tooltips en de splitsingsvulling op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU wordt automatisch teruggevallen op canvas, en `getContext().renderer` rapporteert wat daadwerkelijk is getekend.

<WebgpuHeavyDemo legend element="michi-vz-treemap-chart" :make="makeTreemap" caption="~400 tiles" />

## Speel door de jaren heen

Geef elke tegel op het hoogste niveau een `date` en zet `timeline` aan: de momentopname van een jaar bestaat uit de roottegels die die datum delen - kinderen hebben geen eigen datum nodig - en de tegels glijden tussen jaren terwijl ze van formaat veranderen. Standaard uit - zonder opt-in verandert er niets. Dit is interactief jaar-voor-jaar stappen, niet de eenmalige intro verderop.

<TimelinePlayDemo chart="treemap-chart" hint="Druk op de afspeelknop onder de grafiek: de data stapt door de jaren, één momentopname per keer. Sleep de scrubber om naar een jaar te springen." />

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

- `speedMs` bepaalt het tempo, `loop` begint opnieuw, `autoplay: true` start bij mounten, `showControl: false` verbergt de ingebouwde balk.
- Waarden glijden standaard tussen periodes (`interpolate`); stem de beweging af met `tweenMs` en `easing`, of zet `interpolate: false` voor harde overgangen. Met reduced motion is de overgang altijd hard.
- De headless controller is altijd beschikbaar: `chart.timeline()` biedt `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` en `formatPeriod` in de config voor eigen UI.
- Roottegels zonder `date` blijven in elke periode zichtbaar.
- `timeline` wint het van `progressiveDraw` als beide zijn ingesteld - de onthulanimatie verderop blijft uit zolang de timeline de regie heeft.

## Onthulanimatie

De grafiek tekent zichzelf van links naar rechts bij het mounten, waarbij de elementen na elkaar verschijnen voordat ze op hun plek vallen. Standaard uit - een grafiek kiest ervoor met de `progressiveDraw`-prop.

<RevealDemo chart="treemap-chart" replay-label="Animatie opnieuw afspelen" hint="Elke lijn groeit van het eerste naar het laatste jaar; het label volgt de punt en komt tot stilstand bij het lijneinde. Met reduced motion ingeschakeld verschijnt de grafiek meteen volledig getekend." />

`progressiveDraw: true` gebruikt de standaardinstellingen (1200 ms, easeInOutCubic). Een configuratieobject verfijnt het gedrag:

::: code-group

```tsx [React]
const ref = useRef<TreemapChartHandle>(null);

<TreemapChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() speelt de animatie opnieuw af
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

## Datavorm

Elke `dataSet`-node is een blad (`value`, optionele `partial`) of een ouder (`children`). De waarde van een ouder is de som van zijn bladeren.

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

## Responsieve lay-out

`layout` kiest het tegelalgoritme: `"squarify"` (de treemap), `"stack"` (een verticale partitie in één kolom - rijen over de volle breedte, hoogte proportioneel aan de waarde, met dezelfde splitsing per rij), of `"auto"` (schakelt over naar stack onder `stackBreakpoint`, standaard 480px). De splitsing, labels, tooltip, `getContext()` en SVG/canvas-pariteit zijn bij beide lay-outs identiek.

## API

Props zijn getypeerd als `TreemapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-agnostische [ChartContext](/nl/guide/llm-context). Volledige referentie: [Treemap API](/nl/api/treemap).
