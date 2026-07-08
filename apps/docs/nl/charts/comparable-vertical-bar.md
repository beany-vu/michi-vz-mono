---
title: Vergelijkbare verticale staven
description: "Vergelijkbare verticale staven: twee volledig overlappende kolommen per categorie - een basiswaarde erachter, een vergeleken waarde ervoor - met een verschilpijl boven elk paar. Het verticale migratiedoel voor de legacy sdg-trade BarchartVertical."
---
# Vergelijkbare verticale staven

<span class="vp-badge tip">Vergelijking</span>

Werd het beter of slechter, categorie voor categorie? Elke kolom overlapt twee balken op volledige breedte - de referentiewaarde erachter, de huidige waarde ervoor - met een verschilpijl + label die de verschuiving in één oogopslag toont.

<ChartDemo
  chart="comparable-vertical-bar-chart"
  :legend="[
    { label: '2019 (basis, lichte tint, achter)', color: '#b1b1b1' },
    { label: '2024 (vergeleken, vol, voor)', color: '#6e6e6e' },
  ]"
/>

> De grafiek hierboven gebruikt in elk framework dezelfde **engine** - alleen de integratiecode hieronder verschilt.

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeComparableVertical() {
  const colors = ["#c0392b", "#2c6fbb", "#1f1f1f", "#e07b39", "#2e8b57", "#8e44ad", "#16a085"];
  const dataSet = [];
  for (let i = 0; i < 60; i++) {
    const base = 50 + Math.round(Math.random() * 950);
    const compared = Math.max(1, Math.round(base * (0.6 + Math.random() * 0.8)));
    dataSet.push({
      label: `Sector ${i + 1}`,
      valueBased: base,
      valueCompared: compared,
      color: colors[i % colors.length],
    });
  }
  return { title: "Sector export value: 2019 vs 2024, US$ bn (synthetic)", dataSet };
}
</script>

ComparableVerticalBarChart heeft een optionele `renderer="webgpu"` die de twee subbalken per kolom tekent als GPU-instanced rechthoeken, terwijl assen, labels en de verschilindicator op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo element="michi-vz-comparable-vertical-bar-chart" :make="makeComparableVertical" caption="~60 columns" />

## Gebruik

::: code-group

```tsx [React]
import { ComparableVerticalBarChart } from "@michi-vz/react";

export default () => <ComparableVerticalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ComparableVerticalBarChart } from "@michi-vz/vue";
</script>

<template>
  <ComparableVerticalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { comparableVerticalBarChart } from "@michi-vz/svelte";
</script>

<div use:comparableVerticalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyComparableVerticalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-comparable-vertical-bar-chart #c></michi-vz-comparable-vertical-bar-chart>
applyComparableVerticalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-comparable-vertical-bar-chart id="c"></michi-vz-comparable-vertical-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountComparableVerticalBarChart } from "@michi-vz/core";

const chart = mountComparableVerticalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props zijn getypeerd als `ComparableVerticalBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.

## Gedragsnotities

### Twee volledig overlappende subbalken per kolom, VASTE volgorde

Elke categorie tekent `valueBased` (de referentie-/voorgaande waarde, erachter, geschikt voor arcering) en `valueCompared` (de huidige waarde, ervoor, vol), beide op **dezelfde x en de volledige kolombreedte** - anders dan de optionele "grouped" halve-band-layout van ComparableHorizontalBarChart is deze grafiek uitsluitend overlappend. De tekenvolgorde is **vast** (niet breedte-afhankelijk): `valueBased` wordt altijd erachter getekend, `valueCompared` altijd ervoor - overgenomen van de `BarCompare`/`Bar`-tekenvolgorde van de legacy sdg-trade `BarchartVertical`. `colorsBasedMapping` geeft de valueBased-subbalk per label een eigen kleur: combineer een dekkende lichte tint met `valueBasedOpacity: 1` voor het scherpste voor/na-contrast in beide thema's. `valueBasedOpacity` / `valueComparedOpacity` stellen hun vulopaciteit in (historisch: 0.45 / 0.9). Een subbalk waarvan de opgeloste vulling `transparent` is, wordt **overgeslagen** (consumenten verbergen zo de helft via CSS). `minBarHeight` (standaard 5) zorgt voor een ondergrens op een niet-nul balk, zodat waarden dicht bij nul zichtbaar blijven.

### Verschilindicator - en de context van deze grafiek weerspiegelt hem

`deltaIndicator: { show: true }` tekent een verschilpijl + geformatteerd label BOVEN de hoogste van de twee subbalken (legacy-plaatsing `translate(bandwidth/3, -32)`). Anders dan bij ComparableHorizontalBarChart (waar de indicator puur presentationeel is), **weerspiegelt de `getContext()` van deze grafiek de indicator**: elke `series[]`-rij draagt `deltaDirection` / `deltaColor` / `deltaLabel` wanneer actief, `stats.improved` / `stats.worsened` telt de goede/slechte bewegingen, en de a11y-tabel krijgt een vijfde kolom "Change". `positiveIsGood` / `positiveIsUp` kiezen de kleur-/richtingtoewijzing (zie de JSDoc van `DeltaIndicatorConfig` voor de volledige beslistabel); `formatter(diff, datum)` neemt de volledige controle over de labeltekst. Weggelaten, of `{ show: false }`, is een aantoonbare no-op - geen geometrie, geen `.mv-delta`-DOM, geen extra contextvelden.

### `patternsMapping` - arcering / afbeeldingsvullingen

`patternsMapping: Record<label, imageSrc>` vult de **value-based** subbalk met een herhaalde afbeelding in plaats van een vlakke kleur. `createHatchPattern({ color, angle?, spacing?, strokeWidth? })` (geëxporteerd uit `@michi-vz/core` en `@michi-vz/react`) geeft voor het gangbare geval een diagonale arcering terug als SVG data-URI. De SVG-renderer verwijst ernaar via een echte `<defs><pattern>`; de canvas-renderer herhaalt deze via `ctx.createPattern` en rendert opnieuw zodra de afbeelding geladen is.

### Waarde-as (y)

`yAxisDomain: [min, max]` legt het bereik van de waarde-as vast. `symmetricYDomain` dwingt `[-M, M]` af (M = de grootste absolute waarde) zodat nul gecentreerd staat. `showZeroLineForYAxis` tekent een doorgetrokken lijn op y=0 (divergerende grafieken); `showGrid` schakelt horizontale rasterlijnen in/uit (standaard uit). `yAxisFormat` formatteert de tick-labels; `ticks` stelt het geschatte aantal in.

### Categorie-as (x)

Kolomlabels passen horizontaal wanneer er ruimte is; anders kantelen ze -45° (of dunnen ze uit tot een leesbare subset met `xAxisMode: "horizontal"`), dezelfde `chooseAxisMode`-layout die VerticalStackBarChart gebruikt. `xAxisLabelPadding` verhoogt de drempel voordat een label kantelt; `xAxisFormat` formatteert elk label; `hideTickLabels` verbergt ze volledig; `maxBarWidth` begrenst de dikte van elke kolom (en centreert het plot) zodat een handvol categorieën niet uitgroeit tot enorme blokken.

### Tooltip

`tooltipFormatter(datum, dataSet, type)` ontvangt de kolom waarover gehoverd wordt, alle kolommen, en het `type` van de gehoverde **subbalk** (`"based" | "compared"`). Het geeft een HTML-string terug; de React-wrapper accepteert daarnaast ook een React-node (omgezet naar statische HTML). De ingebouwde tooltip is edge-aware (klapt om nabij de rechter-/onderrand).

### Laden / geen data + interactie

`isLoading` en `isNodata` sturen de overlay aan (React: `isLoadingComponent` / `isNodataComponent`). Hoveren markeert een kolom (andere dimmen) en `mouseleave` maakt dit ongedaan; de balken zijn afgerond (radius 5) met een rand van 1px.

> **Kleurautoriteit van de consument:** de context bevat `legendData` (`{ label, color, dataLabelSafe }`) zodat een CSS-injectie-kleursysteem regels per label kan koppelen; `onChartDataProcessed` wordt alleen uitgezonden wanneer de context **verandert** (het opnieuw uitzenden van een ongewijzigde context bij elke render kan een consument die op elke aanroep dispatcht in een lus laten belanden).
