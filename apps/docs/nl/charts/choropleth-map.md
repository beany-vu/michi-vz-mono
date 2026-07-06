---
title: Choroplethenkaart
description: "Wereld-/regiokaart met choropleten: je eigen GeoJSON, gekleurd via een drempel-kleurschaal of een expliciete categoriekaart. 13 d3-geo/d3-geo-projection-projecties; SVG, canvas en een gedelegeerde WebGPU-laag."
---
# Choroplethenkaart

<span class="vp-badge tip">Geografie</span>

De eerste **geo**-grafiek van de bibliotheek: kleur een wereld- of regiokaart op basis van een waarde. Continue data (exportwaarde, een index, een aandeel) stuurt een drempel-kleurschaal aan; categorische data (een categorie "laatst beschikbare jaar", een status) stuurt een expliciete label → kleur-kaart aan. Geografie is **altijd een prop** - dit package bevat geen topologiegegevens; je importeert je eigen wereld-/regio-GeoJSON en geeft die rechtstreeks door.

<ChartDemo chart="choropleth-map-chart" :legend="[]" />

Categorische modus - `colorsMapping` wint van `colorScale` (de sdg-trade **Data Availability**-use case: een handvol vaste label → kleur-categorieën, geen numeriek verloop):

<ChartDemo chart="choropleth-map-chart" :index="1" :legend="[]" />

::: warning Alleen demogeografie
De wereldatlas op deze pagina is een vereenvoudigd publiek-domein GeoJSON-bestand, alleen ter illustratie meegeleverd met de documentatievoorbeelden. Grenzen, namen en vormen zijn NIET gezaghebbend. Controleer de grenzen en naamgeving van je eigen `geography`-bestand tegen het cartografische beleid van je organisatie vóór productiegebruik: de bibliotheek tekent het bestand zoals het is, zonder correcties.
:::

> De grafiek hierboven gebruikt in elk framework dezelfde **engine** - alleen de integratiecode hieronder verschilt.

## Breng je eigen geografie mee

`geography` accepteert ofwel een volledige GeoJSON-`FeatureCollection`, ofwel een vooraf genormaliseerde `GeoFeatureItem[]` (`{ id, geometry, name? }`). Niets aan de vormen wordt meegeleverd in `@michi-vz/core` - importeer één keer een wereldkaart in je app en hergebruik die op elke choroplethenkaart:

```ts
import worldJson from "./world.json"; // je eigen GeoJSON FeatureCollection
import { ChoroplethMapChart } from "@michi-vz/react";

<ChoroplethMapChart
  geography={worldJson}
  dataSet={[
    { id: "USA", label: "United States", value: 2450 },
    { id: "DEU", label: "Germany", value: 1870 },
    // ...
  ]}
  colorScale={{ domain: [500, 1000, 2000], range: ["#eaf3fb", "#5b9bd5", "#123a63"] }}
/>
```

De `id` van elke feature in een `FeatureCollection` wordt gelezen uit de GeoJSON `Feature.id` (met terugval op `properties.id`); `name` uit `properties.name`. Populaire bronnen: [world-atlas](https://github.com/topojson/world-atlas) (TopoJSON - converteer met `feature()` van `topojson-client`), [Natural Earth](https://www.naturalearthdata.com/), of een regiobestand dat je eigen team onderhoudt. De docs/voorbeelden van dit package bevatten slechts een klein illustratief voorbeeld van 12 vormen - geen echte kustlijnen - zodat de bibliotheek vrij blijft van elke afhankelijkheid van topologiegegevens.

## Gebruik

::: code-group

```tsx [React]
import { ChoroplethMapChart } from "@michi-vz/react";

export default () => <ChoroplethMapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ChoroplethMapChart } from "@michi-vz/vue";
</script>

<template>
  <ChoroplethMapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { choroplethMapChart } from "@michi-vz/svelte";
</script>

<div use:choroplethMapChart={props}></div>
```

```ts [Angular]
// main.ts - registreer de elementen één keer
import "@michi-vz/angular";
import { applyChoroplethMapChartProps } from "@michi-vz/angular";

// component (gebruikt CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-choropleth-map-chart #c></michi-vz-choropleth-map-chart>
applyChoroplethMapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-choropleth-map-chart id="c"></michi-vz-choropleth-map-chart>
<script>
  Object.assign(document.getElementById("c"), props); // geography, dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountChoroplethMapChart } from "@michi-vz/core";

const chart = mountChoroplethMapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-onafhankelijk, LLM-ready
chart.destroy();
```

:::

## API

Props zijn getypeerd als `ChoroplethMapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.

## Gedragsnotities

### `dataSet` koppelen aan `geography` - `joinBy`

Elke `dataSet`-rij (`{ id, label, value?, color? }`) wordt gekoppeld aan een geografie-feature via `joinBy`: `"id"` (standaard) matcht `ChoroplethDataItem.id` met `GeoFeatureItem.id` / GeoJSON `Feature.id` - de schone, stabiele koppeling (bijv. ISO-A3-codes). `"name"` matcht in plaats daarvan `label` met `GeoFeatureItem.name` / `properties.name`, voor data die op landnaam in plaats van code is geïndexeerd. Een feature zonder overeenkomende rij (of een rij in `disabledItems`) wordt getekend met `noDataColor` en de tooltip ontvangt de terugvalvorm `{ id, name }` in plaats van de volledige rij.

### Prioriteit van kleurresolutie

`colorsMapping[label]` (categorisch, expliciet) wint van `colorScale` (continu - een opgeloste hex-`range` + numeriek `domain`, gebouwd in een d3-`scaleThreshold`; waarden buiten het domein klemmen aan de eerste/laatste kleur van de range) die wint van de eigen `color` van de rij die wint van het automatisch toegewezen `colors`-palet. De kern blijft vrij van `d3-scale-chromatic` - geef al opgeloste hexkleuren door aan `colorScale.range`, gegenereerd vanuit een genoemd schema (of elders) in je eigen app als je dat wilt.

### Projecties - alle 13, één standaard

`projection` verdeelt naar `geoEqualEarth`, `geoMercator`, `geoTransverseMercator`, `geoAlbers`, `geoAlbersUsa`, `geoAzimuthalEqualArea`, `geoAzimuthalEquidistant`, `geoOrthographic`, `geoConicConformal`, `geoConicEqualArea`, `geoConicEquidistant`, `geoRobinson` (de standaard), en `geoGilbert` (beide uit `d3-geo-projection`). `projectionConfig` (`scale`, `rotate`, `center`, `parallels`) verfijnt de gekozen projectie; weggelaten velden vallen terug op de eigen standaarden van de legacy sdg-trade `MapChoropleth`-grafiek (`rotate: [-18, 0]`, `center: [0, 10]`, een breedte-afgeleide basisschaal) in plaats van `projection.fitSize` - dit reproduceert exact het visuele resultaat van die grafiek in plaats van opnieuw te passen op een ander kader. `geoAlbersUsa` is een vaste samengestelde projectie: ze negeert `rotate` / `center` / `parallels`.

### Rendering: SVG, canvas en een gedelegeerde WebGPU

`renderer="svg"` (standaard) tekent één `<path class="region">` per feature. `renderer="canvas"` tekent via `geoPath(projection, ctx)` - d3-geo rendert nativeif en efficiënt rechtstreeks naar een 2D-canvascontext, dus niets herparseert de SVG-padstring of herimplementeert de projectiewiskunde. `renderer="webgpu"` **delegeert** naar dezelfde canvas-2D-renderer in plaats van willekeurige polygonen op de GPU te trianguleren: reële regio's zijn vaak concaaf, meerdere ringen, met gaten (een enclave, een eilandengroep), en correcte GPU-triangulatie van willekeurige eenvoudige polygonen vereist echte ear-clipping - buiten proportie ten opzichte van de al snelle native 2D-rendering van d3-geo voor een grafiek met doorgaans enkele tientallen tot enkele honderden paden. Het blijft capability-gated op `navigator.gpu` en rapporteert de effectieve renderer via `getContext().renderer`, net als elke andere grafiek.

### Hover / tooltip

`tooltipFormatter(d)` ontvangt het volledige `ChoroplethDataItem` voor een gekoppelde regio, of `{ id, name }` voor een niet-gekoppelde. In canvas-/webgpu-modus wordt hoveren opgelost door de ruwe geometrie van elke feature opnieuw te projecteren en een punt-in-polygoon-test uit te voeren (geen bounding-box-benadering), zodat onregelmatige grenzen correct worden gedetecteerd. Hoveren dimt elke andere regio (het standaard `highlightItems`-gedrag van het huis) in plaats van een blijvende CSS-`:hover`-randverdonkering - het hover-effect van de legacy-grafiek.

### Laden / geen data

`isLoading` en `isNodata` sturen de overlay aan (React: `isLoadingComponent` / `isNodataComponent`), identiek aan elke andere grafiek in het huis.

> **Kleurautoriteit van de consument:** de context bevat `legendData` (`{ label, color, dataLabelSafe }`) zodat een CSS-injectie-kleursysteem regels per label kan koppelen; `onChartDataProcessed` wordt alleen uitgezonden wanneer de context **verandert**.
