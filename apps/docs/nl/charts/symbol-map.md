---
title: Symboolkaart
description: "Een symbool-/bellenkaart waarvan overlappingen worden opgelost door een eenmalige d3-force-simulatie: je geeft lng/lat per item op. Standaard dot-only (legacy-pariteit); een optionele gedempte achtergrondlandmassa is beschikbaar. SVG, canvas en een gedelegeerde WebGPU-laag."
---
# Symboolkaart

<span class="vp-badge tip">Geografie</span>

Grafiek #20: een bellenkaart waarvan overlappingen worden opgelost door een krachtsimulatie. Migratiedoel voor de legacy sdg-trade **MapSymbolForce** - een dot-only bellenkaart waarbij de coördinaten van elk item op het vlak worden geprojecteerd, waarna een eenmalige krachtsimulatie overlappende cirkels net genoeg uit elkaar duwt om leesbaar te blijven, zonder ze ver van hun werkelijke positie te verplaatsen. In tegenstelling tot [Choroplethenkaart](/nl/charts/choropleth-map) is geografie hier **optioneel**: laat het weg voor de dot-only look van de legacy-grafiek (de standaard), of geef het op om een gedempte achtergrondlandmassa achter de symbolen te tekenen.

<ChartDemo chart="symbol-map-chart" :legend="[]" />

Een concentrische tweede ring (`valueSecond`) leest als een submetriek van de buitenste cirkel - bijvoorbeeld "waarvan" een specifieke partner of kanaal:

<ChartDemo chart="symbol-map-chart" :index="1" :legend="[]" />

## Exacte posities of force-ontklontering

`positionMode` bepaalt wat de positie van een symbool betekent:

- **`"force"` (standaard, legacy-pariteit)**: de eenmalige simulatie duwt overlappende cirkels uit elkaar. Leesbaar wanneer veel symbolen op één plek samenklonteren, maar elk symbool kan van zijn echte coördinaten afdrijven, en op een klein plot kan die afwijking groot zijn.
- **`"precise"`**: elk symbool blijft exact op zijn geprojecteerde `lng`/`lat`; overlappende cirkels zijn toegestaan.

Een symbool boven het verkeerde land is een cartografisch nauwkeurigheidsprobleem en voor sommige doelgroepen politiek gevoelig. Kies `"precise"` zodra er een `geography`-achtergrond zichtbaar is: een landmassa nodigt uit om posities letterlijk te lezen.

<PositionModeDemo labelPrecise="precise: echte posities" labelForce="force: ontklonteren" hint="Schakel naar force en zie de bellen van hun echte coördinaten wegdrijven om botsingen op te lossen. Met een zichtbare landmassa is precise meestal de eerlijke keuze." />

::: warning Alleen demogeografie
De wereldatlas op deze pagina is een vereenvoudigd publiek-domein GeoJSON-bestand, alleen ter illustratie meegeleverd met de documentatievoorbeelden. Grenzen, namen en vormen zijn NIET gezaghebbend. Controleer de grenzen en naamgeving van je eigen `geography`-bestand tegen het cartografische beleid van je organisatie vóór productiegebruik: de bibliotheek tekent het bestand zoals het is, zonder correcties.
:::

> De grafiek hierboven is dezelfde **engine** in elk framework - alleen de integratiecode hieronder verschilt.

## Breng je eigen coördinaten mee

In tegenstelling tot de legacy-grafiek (die een statische CSV van ongeveer 200 landcoördinaten bundelde), bundelt `@michi-vz/core` **geen** coördinatentabel. Elk `dataSet`-item levert zijn eigen `lng`/`lat`:

```ts
import { SymbolMapChart } from "@michi-vz/react";

<SymbolMapChart
  dataSet={[
    { id: "usa", label: "United States", lng: -95.7, lat: 38.9, value: 100 },
    { id: "deu", label: "Germany", lng: 13.4, lat: 52.5, value: 60, valueSecond: 30 },
    // ...
  ]}
/>
```

Omdat de extent die wordt gebruikt om de dot-only lay-out op het plotgebied te passen, wordt afgeleid van de coördinaten van je eigen dataset (niet van een gebundelde, altijd-volledige wereldtabel), strekt de "wereld" die de grafiek tekent zich alleen zo ver uit als de punten die je aanlevert - zie [Gedragsnotities](#dot-only-vs-achtergrondprojectie) hieronder.

## Gebruik

::: code-group

```tsx [React]
import { SymbolMapChart } from "@michi-vz/react";

export default () => <SymbolMapChart {...props} />; // props = de grafiekopties
```

```vue [Vue]
<script setup>
import { SymbolMapChart } from "@michi-vz/vue";
</script>

<template>
  <SymbolMapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { symbolMapChart } from "@michi-vz/svelte";
</script>

<div use:symbolMapChart={props}></div>
```

```ts [Angular]
// main.ts - registreer de elementen eenmalig
import "@michi-vz/angular";
import { applySymbolMapChartProps } from "@michi-vz/angular";

// component (gebruikt CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-symbol-map-chart #c></michi-vz-symbol-map-chart>
applySymbolMapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-symbol-map-chart id="c"></michi-vz-symbol-map-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountSymbolMapChart } from "@michi-vz/core";

const chart = mountSymbolMapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-onafhankelijk, LLM-klaar
chart.destroy();
```

:::

## API

Props zijn getypeerd als `SymbolMapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context).

## Gedragsnotities

### De eenmalige krachtgebaseerde overlap-oplossing

De `lng`/`lat` van elk item projecteert naar een "echte" pixelpositie; `forceX`/`forceY` zetten de simulatie vast op precies die positie als doel, `forceManyBody()` voegt lichte scheiding toe, en `forceCollide` (straal + 2px opvulling, 3 iteraties) is wat overlappende cirkels daadwerkelijk uit elkaar duwt. De simulatie stabiliseert synchroon tot DEZELFDE alfa-drempel als de legacy-grafiek (`0.0011`) - deterministisch: identieke invoer stabiliseert altijd tot dezelfde lay-out, dus twee keer dezelfde data monteren levert pixel-identieke posities op. Twee items met *exact dezelfde* coördinaten beginnen gestapeld en scheiden netjes zodra de simulatie stabiliseert.
`positionMode: "precise"` slaat de simulatie volledig over: elk symbool blijft dan op zijn exacte geprojecteerde positie en overlappingen zijn toegestaan (zie de schakel-demo hierboven).

### Dot-only vs. achtergrondprojectie

Zonder `geography` wordt de gekozen `projection` (standaard `"geoMercator"`, zoals de legacy-grafiek) **ongetuned** gebruikt - een kale projectiefabriek zonder de translate/scale/rotate/center-afstemming van [Choroplethenkaart](/nl/charts/choropleth-map) - en de extent van de geprojecteerde punten wordt vervolgens herschaald om het plotgebied te vullen, wat de eigen berekening van de legacy-grafiek weerspiegelt. Met `geography` opgegeven neemt in plaats daarvan DEZELFDE afgestemde dispatch die Choroplethenkaart gebruikt het over, zodat de achtergrondlandmassa en de symboolcoördinaten één consistente geografische framing delen (geen extent-herschaling).

### `radiusVisibleMin` - gefilterd op de ruwe waarde

`radiusVisibleMin` verbergt items waarvan de **ruwe** `value` op of onder de drempel ligt (en, wanneer `valueSecond` is ingesteld, waarvan `valueSecond` ook eronder ligt) **voordat** de krachtlay-out wordt uitgevoerd - overgenomen van het eigen filter van de legacy-grafiek, dat de ruwe waarde vergeleek, nooit de geschaalde straal. Het domein van de straal-/opaciteitsschaal wordt nog steeds opgebouwd uit elk item met geldige coördinaten, ongeacht dit filter, zodat de straal van een symbool vergelijkbaar blijft tussen renders, zelfs als de drempel verandert.

### De concentrische tweede ring

`valueSecond` tekent een tweede cirkel, dezelfde kleur als de buitenste, op `opacity - 0.3` (begrensd op niet-negatief), BOVENOP de primaire cirkel getekend - exact overgenomen van de eigen gelaagdheid van de legacy `ForceNode`. Wanneer de tweede cirkel kleiner is dan de buitenste, leest deze als een dovere kern binnen een lichtere ring (bijv. "waarvan"); wanneer groter, bedekt hij de buitenste cirkel volledig.

### Optionele achtergrondgeografie

`geography` (een GeoJSON `FeatureCollection` of een vooraf genormaliseerde `GeoFeatureItem[]`, zelfde contract als de `geography` van Choroplethenkaart) is een **nieuwe** mogelijkheid - de legacy-grafiek tekende nooit landmassa. Laat het weg voor de dot-only legacy-look; geef het op voor een gedempte, niet-interactieve achtergrond (`geographyColor`, standaard `#eef1f5`) achter de symbolen.

### Rendering: SVG, canvas en een gedelegeerde WebGPU

`renderer="svg"` (standaard) tekent één `<circle class="symbol">` per zichtbaar item (plus een optionele `<circle class="symbol-second">`). `renderer="canvas"` tekent dezelfde markeringen op een 2D-canvas, waarbij de vulkleur wordt opgelost via dezelfde consumenten-CSS-sonde die elke enkelvoudige-markeringsgrafiek gebruikt. `renderer="webgpu"` **delegeert** naar de canvas-2D-renderer, dezelfde reden als Choroplethenkaart: de optionele achtergrond is willekeurige (mogelijk concave, meerringige) GeoJSON, dus correcte GPU-tessellatie is hier onevenredig veel werk.

### Laden / geen gegevens

`isLoading` en `isNodata` sturen de overlay aan (React: `isLoadingComponent` / `isNodataComponent`), identiek aan elke andere grafiek in het huis.

> **Kleurautoriteiten aan consumentzijde:** de context bevat `legendData` (`{ label, color, dataLabelSafe }`) zodat een CSS-injectie-kleursysteem regels per label kan koppelen; `onChartDataProcessed` wordt alleen uitgezonden wanneer de context **verandert**.
