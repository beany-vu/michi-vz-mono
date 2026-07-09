---
title: Verticale gestapelde staven
description: "Verticaal gestapeld staafdiagram voor samenstelling over categorieën, met een expliciete bescherming die ontbrekende segmenten markeert in plaats van ze plat te slaan naar nul."
---
# Verticale gestapelde staven

<span class="vp-badge tip">Samenstelling</span>

"Waaruit bestaat elke categorie, en hoe verschuift de mix ertussen?" Stapel de onderdelen in één staaf per categorie en de samenstelling leest in één oogopslag. Wanneer een segment ontbreekt, markeert een expliciete bescherming het hiaat in plaats van het stilzwijgend plat te slaan naar nul.

<ChartDemo chart="vertical-stack-bar-chart" />

Moet je twee dingen naast elkaar vergelijken? Geef **meer dan één reeks** door in `dataSet` en de staven **groeperen**: per x-categorie krijg je één gestapelde staaf per reeks, samen geclusterd. Hier, twee regio's over drie jaar, elke staaf opgesplitst in vijf productlijnen - zodat je in één keer leest welke regio groter is *en* hoe de mix verschilt:

<ChartDemo chart="vertical-stack-bar-chart" :index="1" />

> De grafiek hierboven is dezelfde **engine** in elk framework - alleen de integratiecode hieronder verschilt.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeVsb() {
  const keys = ["Cloud", "Hardware", "Licenses", "Services", "Support"];
  const base = { Cloud: 40, Hardware: 60, Licenses: 50, Services: 30, Support: 20 };
  const drift = { Cloud: 3.2, Hardware: -0.4, Licenses: 0.6, Services: 1.8, Support: 0.3 };
  const series = [];
  for (let i = 0; i < 150; i++) {
    const row = { date: String(2000 + i) };
    for (const k of keys) {
      const noise = (Math.random() - 0.5) * 8;
      row[k] = Math.max(1, base[k] + drift[k] * i * 0.1 + noise);
    }
    series.push(row);
  }
  const dataSet = [
    {
      seriesKey: "Global",
      seriesKeyAbbreviation: "GLB",
      series,
    },
  ];
  return { dataSet, keys, keysOrder: "bottomToTop" };
}
</script>

VerticalStackBarChart heeft een optionele `renderer="webgpu"` die de staven op de GPU tekent, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU wordt automatisch teruggevallen op canvas, en `getContext().renderer` rapporteert wat daadwerkelijk is getekend.

<WebgpuHeavyDemo legend element="michi-vz-vertical-stack-bar-chart" :make="makeVsb" caption="~150 bars × 5 keys" />

## Onthulanimatie

De grafiek tekent zichzelf van links naar rechts bij het mounten, waarbij de elementen na elkaar verschijnen voordat ze op hun plek vallen. Standaard uit - een grafiek kiest ervoor met de `progressiveDraw`-prop.

<RevealDemo chart="vertical-stack-bar-chart" replay-label="Animatie opnieuw afspelen" hint="Elke lijn groeit van het eerste naar het laatste jaar; het label volgt de punt en komt tot stilstand bij het lijneinde. Met reduced motion ingeschakeld verschijnt de grafiek meteen volledig getekend." />

`progressiveDraw: true` gebruikt de standaardinstellingen (1200 ms, easeInOutCubic). Een configuratieobject verfijnt het gedrag:

::: code-group

```tsx [React]
const ref = useRef<VerticalStackBarChartHandle>(null);

<VerticalStackBarChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() speelt de animatie opnieuw af
```

```vue [Vue]
<VerticalStackBarChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:verticalStackBarChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyVerticalStackBarChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-vertical-stack-bar-chart id="c"></michi-vz-vertical-stack-bar-chart>
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

De data beslaat al meerdere jaren, dus er is niets te taggen. Zet `timeline` aan: de eigen afspeelknop en scrubber van de grafiek stappen door die jaren - bij elke stap tekent elke gestapelde staaf zich alleen tot het actieve jaar, en tijdens het afspelen loopt de stapel vloeiend verder door. Scrub je terug, dan trekken de staven zich weer terug. Hoveren toont alleen wat al echt getekend is. Standaard uit - zonder opt-in verandert er niets.

<TimelinePlayDemo chart="vertical-stack-bar-chart" hint="Druk op de afspeelknop onder de grafiek: de grafiek tekent zich verder door tot elk jaar terwijl hij speelt. Sleep de scrubber om naar een jaar te springen." />

::: code-group

```tsx [React]
const ref = useRef<VerticalStackBarChartHandle>(null);

<VerticalStackBarChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<VerticalStackBarChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:verticalStackBarChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyVerticalStackBarChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-vertical-stack-bar-chart id="c"></michi-vz-vertical-stack-bar-chart>
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
import { VerticalStackBarChart } from "@michi-vz/react";

export default () => <VerticalStackBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { VerticalStackBarChart } from "@michi-vz/vue";
</script>

<template>
  <VerticalStackBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { verticalStackBarChart } from "@michi-vz/svelte";
</script>

<div use:verticalStackBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyVerticalStackBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-vertical-stack-bar-chart #c></michi-vz-vertical-stack-bar-chart>
applyVerticalStackBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-vertical-stack-bar-chart id="c"></michi-vz-vertical-stack-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountVerticalStackBarChart } from "@michi-vz/core";

const chart = mountVerticalStackBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props zijn getypeerd als `VerticalStackBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-agnostische [ChartContext](/nl/guide/llm-context).

## Gedragsnotities

Dit gedrag is automatisch (geen extra bedrading nodig) en komt overeen met de legacy `michi-vz`-grafiek, voor drop-in-pariteit.

### Dichte x-as - automatisch draaien / uitdunnen

De band-as meet zijn labels en past zich aan: **horizontaal** wanneer ze passen, **gedraaid −45°** (alle labels blijven getoond) wanneer ze niet passen, en **uitgedund** tot een gelijkmatig verdeelde subset alleen bij extreme dichtheid. De ondermarge wordt automatisch gereserveerd zodat gedraaide labels nooit worden afgesneden. Geen prop nodig - geef `xAxisFormat` door om de tick-tekst te formatteren (bijv. `202401` → `01-2024`).

### `date` accepteert getallen

De `date` van een rij mag een `number` zijn (bijv. `date: 2024`) of een string; de engine dwingt dit af met `String()`. De bandschaal is `scaleBand<string>`, dus gemengde types worden consistent genormaliseerd.

### `keysOrder` en kleurvolgorde

`keysOrder` (`"topToBottom"` standaard | `"bottomToTop"`) bepaalt aan welk uiteinde van de stapel `keys[0]` zich bevindt. Met `"bottomToTop"` is de **legenda-/kleurvolgorde omgekeerd** ten opzichte van de tekenvolgorde van de stapel - een kleurautoriteit aan de consumentzijde die kleuren toewijst op basis van de volgorde van voorkomen in `legendData` bindt slot 0 daarom aan de *bovenste* key, niet aan de onderste. De teken- (pixel)volgorde van de stapel wordt onafhankelijk bepaald en blijft ongewijzigd.

### `filter` - Top/Bottom-N groepen

`filter = { limit, sortingDir }` rangschikt de **DataSets** (groepen) op hun totaal over alle rijen + keys en behoudt de top (`"desc"`) of bottom (`"asc"`) `limit`. Alles stroomafwaarts (keys, datums, y-domein, staven en legenda) wordt afgeleid van de gefilterde set, zodat de legenda altijd exact de getekende staven weerspiegelt.

### `disabledItems`

Namen in `disabledItems` laten overeenkomende **segment-keys** *en* **DataSet-groepen** vervallen. Het uitschakelen van een groep laat de overige staven **breder** worden, zodat de band tussen de zichtbare groepen wordt opgesplitst.

### `tooltipFormatter`

Ontvangt `{ item, key, seriesKey, series, isMissing }` - `item` is de volledige datarij, `key` het gehoverde segment, `series` de rijen van het gehoverde segment over alle datums. De ingebouwde tooltip is **randbewust**: hij klapt naar links van de cursor om bij de rechterrand, en zakt onder de cursor bij de bovenkant, zodat hij nooit buiten het scherm valt.

### Interactie (canvas)

Hoveren over een segment dimt de andere segmenten **in hetzelfde frame** (geen inputvertraging); het verlaten van de grafiek heft de demping op. **Klik** op een staaf om de tooltip vast te zetten, klik er nogmaals op om opnieuw vast te zetten, en klik buiten de grafiek om los te maken.
