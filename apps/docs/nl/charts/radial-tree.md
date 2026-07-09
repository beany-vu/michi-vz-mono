---
title: Radiale boom
description: "Een radiaal cluster()/dendrogram: bladeren liggen op gelijke afstand van het centrum, met cirkels die zowel op groeps- als bladniveau geschaald zijn. Adaptieve labeldichtheid (afkorten/afkappen/verbergen/roteren) naarmate het aantal bladeren groeit, en een optionele, automatisch afbrekende centrumtitel. SVG, canvas en een gedelegeerde WebGPU-laag."
---
# Radiale boom

<span class="vp-badge tip">Compositie</span>

Grafiek #21 - de laatste nieuwe grafiek in de sdg-trade-migratie: een radiaal cluster()/dendrogram. Migratiedoel voor de legacy sdg-trade **TreeRadial** - groepen waaieren uit vanaf een middelpunt, waarbij de bladeren van elke groep op hun eigen radiale spaak zitten en elk blad op DEZELFDE afstand van het centrum landt (een echt dendrogram - zie de [gedragsnotities](#cluster-niet-tree) hieronder).

<ChartDemo chart="radial-tree-chart" :legend="[]" />

Meer bladeren duwen de adaptieve labeldrempels voorbij - labels worden afgekort en roteren radiaal, om vervolgens helemaal te verdwijnen zodra de boom erg dicht wordt:

<ChartDemo chart="radial-tree-chart" :index="1" :legend="[]" />

> De grafiek hierboven is dezelfde **engine** in elk framework - alleen de integratiecode hieronder verschilt.

## Vorm spiegelt Treemap

`RadialTreeNode` spiegelt bewust de vorm van [`TreemapNode`](/nl/charts/treemap) - `label` / `code` / `value` / `color` / `children` - voor API-consistentie tussen de twee hiërarchische grafieken. De kleurgroep van een knoop is het label van zijn ancestor op het HOOGSTE niveau, precies zoals Treemap: een blad erft de kleur van zijn groep, tenzij het (of de groep) een eigen `color` instelt.

```ts
import { RadialTreeChart } from "@michi-vz/react";

<RadialTreeChart
  centerLabel="Totale handelswaarde"
  dataSet={[
    {
      label: "Landbouw",
      children: [
        { label: "Koffie", value: 8 },
        { label: "Thee", value: 5 },
        // ...
      ],
    },
    // ...
  ]}
/>
```

De eigen waarde van een groep is ALTIJD de som van zijn kinderen (een expliciete `value` op een knoop met `children` wordt genegeerd) - je geeft dus alleen bladwaarden op.

## Speel door de jaren heen

Geef elke knoop op het hoogste niveau een `date` en zet `timeline` aan: de momentopname van een jaar bestaat uit de rootknopen die die datum delen - kinderen hebben geen eigen datum nodig - en de cirkels glijden tussen jaren terwijl ze van formaat veranderen. Standaard uit - zonder opt-in verandert er niets. Dit is interactief jaar-voor-jaar stappen, niet de eenmalige intro verderop.

<TimelinePlayDemo chart="radial-tree-chart" hint="Druk op de afspeelknop onder de grafiek: de data stapt door de jaren, één momentopname per keer. Sleep de scrubber om naar een jaar te springen." />

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

- `speedMs` bepaalt het tempo, `loop` begint opnieuw, `autoplay: true` start bij mounten, `showControl: false` verbergt de ingebouwde balk.
- Waarden glijden standaard tussen periodes (`interpolate`); stem de beweging af met `tweenMs` en `easing`, of zet `interpolate: false` voor harde overgangen. Met reduced motion is de overgang altijd hard.
- De headless controller is altijd beschikbaar: `chart.timeline()` biedt `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` en `formatPeriod` in de config voor eigen UI.
- Rootknopen zonder `date` blijven in elke periode zichtbaar.
- `timeline` wint het van `progressiveDraw` als beide zijn ingesteld - de onthulanimatie verderop blijft uit zolang de timeline de regie heeft.

## Onthulanimatie

De grafiek tekent zichzelf van links naar rechts bij het mounten, waarbij de elementen na elkaar verschijnen voordat ze op hun plek vallen. Standaard uit - een grafiek kiest ervoor met de `progressiveDraw`-prop.

<RevealDemo chart="radial-tree-chart" replay-label="Animatie opnieuw afspelen" hint="Elke lijn groeit van het eerste naar het laatste jaar; het label volgt de punt en komt tot stilstand bij het lijneinde. Met reduced motion ingeschakeld verschijnt de grafiek meteen volledig getekend." />

`progressiveDraw: true` gebruikt de standaardinstellingen (1200 ms, easeInOutCubic). Een configuratieobject verfijnt het gedrag:

::: code-group

```tsx [React]
const ref = useRef<RadialTreeChartHandle>(null);

<RadialTreeChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() speelt de animatie opnieuw af
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
import { RadialTreeChart } from "@michi-vz/react";

export default () => <RadialTreeChart {...props} />; // props = de grafiekopties
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
// main.ts - registreer de elementen eenmalig
import "@michi-vz/angular";
import { applyRadialTreeChartProps } from "@michi-vz/angular";

// component (gebruikt CUSTOM_ELEMENTS_SCHEMA)
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
chart.getContext(); // renderer-agnostisch, LLM-klaar
chart.destroy();
```

:::

## API

Props zijn getypeerd als `RadialTreeChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-agnostische [ChartContext](/nl/guide/llm-context) terug.

## Gedragsnotities

### cluster(), niet tree()

De layout wordt gebouwd met d3-hierarchy's `cluster()` - geverifieerd tegen de exacte aanroep van de legacy-grafiek - NIET `tree()`. `cluster()` plaatst elk BLAD op dezelfde radiale afstand van het centrum, ongeacht hoeveel niveaus zijn tak heeft, wat dit tot een echt dendrogram maakt; `tree()` zou elke tak juist schalen naar de diepte van zijn eigen subboom, waarbij bladeren op verschillende dieptes op verschillende stralen zouden landen.

### Cirkels op twee niveaus, één lineaire schaal

Zowel de GROEPScirkel (geschaald naar het totaal van de groep) als elke BLADcirkel (geschaald naar zijn eigen waarde) worden getekend vanuit DEZELFDE lineaire schaal (geverifieerd tegen de eigen `scaleLinear` van de legacy-grafiek - geen sqrt-schaal) over het gecombineerde domein van de waarde van elke groep ÉN elk blad. `radiusRange` (standaard `[2, 32]`, de legacy `circleRange`) bepaalt het uitvoerbereik van de schaal.

### Adaptieve labeldichtheid

Labels reageren op het totale aantal BLADEREN via `labelDensityThresholds`:

- Onder `rotateAbove` (standaard 20): elke knoop toont zijn volledige naam; bij lage tot middelmatige dichtheid wordt de naam van een groep op het hoogste niveau bovendien afgekapt tot 10 tekens zodra het aantal de helft van `rotateAbove` overschrijdt (een behouden eigenaardigheid uit de legacy-code - bladeren worden nooit op deze manier afgekapt).
- Boven `rotateAbove`: elk label wordt afgekort tot 3 letters + "." en roteert radiaal in plaats van horizontaal te blijven.
- Boven `hideAbove` (standaard 100): er worden helemaal geen labels getekend.

### centerLabel woordafbreking

`centerLabel` (de legacy `titleCenter`) tekent een klein cirkeltje in het centrum (een kwart van de buitenstraal) met tekst die ongeveer om de 10 tekens afbreekt - een vereenvoudigde, deterministische port van de pixelbreedte-bewuste afbreking uit de legacy-code.

### Verbindingen

Elke knoop tekent een gebogen (kubische bézier) verbinding terug naar zijn ouder - de radiale "spaken" van het dendrogram - overgenomen van de formule voor controlepunten van de legacy-grafiek. Verbindingen worden als één achtergrondlaag getekend, zodat een verbinding nooit visueel een cirkel bedekt (een gedocumenteerde, puur cosmetische vereenvoudiging van de per-knoop DOM-verweving in de legacy-code).

### Nesten dieper dan 2 niveaus

Het consumentencontract is 2 niveaus (groep + blad), maar diepere nesting wordt getolereerd: elk extra niveau krijgt nog steeds een geschaalde cirkel en een verbinding, `onDataWarning` meldt het (`excess-depth`), en de labeldichtheidsregels blijven van toepassing (de regel die alleen voor diepte 1 geldt, stopt met toepassen onder het hoogste niveau).

### Rendering: SVG, canvas en een gedelegeerde WebGPU

`renderer="svg"` (standaard) tekent één `<circle class="radial-tree-node-circle">` per knoop. `renderer="canvas"` tekent dezelfde marks op een 2D-canvas, waarbij de vulkleur wordt opgelost via dezelfde consumenten-CSS-probe die elke single-mark-grafiek gebruikt. `renderer="webgpu"` **delegeert** naar de canvas-2D-renderer, om dezelfde reden als Choropleth Map / Symbol Map: de verbindingen van het dendrogram zijn gebogen bézierpaden, dus correcte GPU-tessellatie is hier onevenredig veel werk.

### Laden / geen data

`isLoading` en `isNodata` sturen de overlay aan (React: `isLoadingComponent` / `isNodataComponent`), identiek aan elke andere grafiek in huis.

> **Consumenten-kleurautoriteiten:** de context draagt `legendData` (`{ label, color, dataLabelSafe }`, één rij per groep op het hoogste niveau) zodat een CSS-injectie-kleursysteem regels per label kan targeten; `onChartDataProcessed` wordt alleen uitgezonden wanneer de context **verandert**.
