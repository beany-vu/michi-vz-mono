---
title: Vergelijkbare staven
description: "Vergelijkbare staven: voor en na naast elkaar op één balk per label, zodat het verschil dat gedicht of geopend is het eerste is wat lezers zien."
---
# Vergelijkbare staven

<span class="vp-badge tip">Vergelijking</span>

Werd het beter of slechter? Zet voor en na naast elkaar op één balk per label, en het verschil dat gedicht (of geopend) is, is het eerste wat de lezer ziet.

<ChartDemo
  chart="comparable-horizontal-bar-chart"
  :legend="[
    { label: '2019 (voor, lichte tint)', color: '#b1b1b1' },
    { label: '2024 (na, vol)', color: '#6e6e6e' },
  ]"
/>

> De grafiek hierboven gebruikt in elk framework dezelfde **engine** - alleen de integratiecode hieronder verschilt.

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeComparable() {
  const colors = ["#c0392b", "#2c6fbb", "#1f1f1f", "#e07b39", "#2e8b57", "#8e44ad", "#16a085"];
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const base = 50 + Math.round(Math.random() * 2950);
    const compared = Math.max(1, Math.round(base * (0.6 + Math.random() * 0.8)));
    dataSet.push({
      label: `Region ${i + 1}`,
      valueBased: base,
      valueCompared: compared,
      color: colors[i % colors.length],
    });
  }
  return { title: "Merchandise exports: 2019 vs 2024, US$ bn (synthetic)", dataSet, interactiveRowLabels: true };
}
</script>

ComparableHorizontalBarChart heeft een optionele `renderer="webgpu"` die de twee subbalken per rij tekent als GPU-instanced rechthoeken, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo element="michi-vz-comparable-horizontal-bar-chart" :make="makeComparable" caption="~120 rows" />

## Speel door de jaren heen

Geef elke rij een `date` en zet `timeline` aan: het staafdiagram wordt een verhaal per jaar, met een eigen afspeelknop en scrubber die telkens het voor/na-verschil van één periode toont. Standaard uit - zonder opt-in verandert er niets.

<TimelinePlayDemo chart="comparable-horizontal-bar-chart" hint="Druk op de afspeelknop onder de grafiek: de data stapt door de jaren, één momentopname per keer. Sleep de scrubber om naar een jaar te springen." />

::: code-group

```tsx [React]
const ref = useRef<ComparableHorizontalBarChartHandle>(null);

<ComparableHorizontalBarChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<ComparableHorizontalBarChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:comparableHorizontalBarChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyComparableHorizontalBarChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-comparable-horizontal-bar-chart id="c"></michi-vz-comparable-horizontal-bar-chart>
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
import { ComparableHorizontalBarChart } from "@michi-vz/react";

export default () => <ComparableHorizontalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ComparableHorizontalBarChart } from "@michi-vz/vue";
</script>

<template>
  <ComparableHorizontalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { comparableHorizontalBarChart } from "@michi-vz/svelte";
</script>

<div use:comparableHorizontalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyComparableHorizontalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-comparable-horizontal-bar-chart #c></michi-vz-comparable-horizontal-bar-chart>
applyComparableHorizontalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-comparable-horizontal-bar-chart id="c"></michi-vz-comparable-horizontal-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountComparableHorizontalBarChart } from "@michi-vz/core";

const chart = mountComparableHorizontalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props zijn getypeerd als `ComparableHorizontalBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.

## Gedragsnotities

### Twee subbalken per rij

Elke rij tekent `valueBased` (licht) en `valueCompared` (vol), divergerend vanaf x=0; de kortste subbalk wordt bovenop getekend, zodat beide waarden zichtbaar blijven welke kant de waarde ook op ging. `colorsBasedMapping` geeft de valueBased-subbalk per label een eigen kleur: combineer een dekkende lichte tint met `valueBasedOpacity: 1` (zoals de demo hierboven) voor het scherpste voor/na-contrast in beide thema's. `valueBasedOpacity` / `valueComparedOpacity` stellen hun vulopaciteit in. Een subbalk waarvan de opgeloste vulling `transparent` is, wordt **overgeslagen** (consumenten verbergen zo de helft via CSS). `minBarWidth` (standaard 5) zorgt voor een ondergrens op een niet-nul balk, zodat waarden dicht bij nul zichtbaar blijven.

### `patternsMapping` - arcering / afbeeldingsvullingen

`patternsMapping: Record<label, imageSrc>` vult de **value-based** subbalk met een herhaalde afbeelding in plaats van een vlakke kleur. `createHatchPattern({ color, angle?, spacing?, strokeWidth? })` (geëxporteerd uit `@michi-vz/core` en `@michi-vz/react`) geeft voor het gangbare geval een diagonale arcering terug als SVG data-URI. De canvas-renderer herhaalt deze via `ctx.createPattern` en rendert opnieuw zodra de afbeelding geladen is.

### Waarde-as (x)

`xAxisPredefinedDomain: [min, max]` legt het bereik van de waarde-as vast (alias van `xAxisDomain`). `showZeroLineForXAxis` tekent een doorgetrokken lijn op x=0 (divergerende grafieken); `showGrid` schakelt verticale rasterlijnen in/uit (standaard uit). `xAxisFormat` formatteert de tick-labels.

### Labelkolom (y)

De categorielabels van de y-as staan in een linkerkolom van `tickHtmlWidth` px breed (standaard 100, met ellips). `padding.left` verschuift het **plot** (balken + waarde-as) naar rechts ZONDER de labels te verplaatsen - zodat er ruimte ontstaat voor een brede labelkolom. `horizontalTickPosition: { x, y }` verschuift de labels zodat ze aansluiten op een externe legenda. `hideTickLabels` verbergt ze volledig (wanneer de categorienamen al in een legenda staan).

### Tooltip

`tooltipFormatter(datum, dataSet, type)` ontvangt de rij waarover gehoverd wordt, alle rijen, en het `type` van de gehoverde **subbalk** (`"based" | "compared"`). Het geeft een HTML-string terug; de React-wrapper accepteert daarnaast ook een React-node (omgezet naar statische HTML). De ingebouwde tooltip is edge-aware (klapt om nabij de rechter-/bovenrand).

### Laden / geen data + interactie

`isLoading` en `isNodata` sturen de overlay aan (React: `isLoadingComponent` / `isNodataComponent`). Hoveren markeert een rij (andere dimmen) en `mouseleave` maakt dit ongedaan; de balken zijn afgerond (radius 5) met een rand van 1px.

> **Kleurautoriteit van de consument:** de context bevat `legendData` (`{ label, color, dataLabelSafe }`) zodat een CSS-injectie-kleursysteem regels per label kan koppelen; `onChartDataProcessed` wordt alleen uitgezonden wanneer de context **verandert** (het opnieuw uitzenden van een ongewijzigde context bij elke render kan een consument die op elke aanroep dispatcht in een lus laten belanden).
