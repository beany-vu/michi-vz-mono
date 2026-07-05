---
title: Fontein (Jet d'Eau)
description: "Fontein (Jet d'Eau)-grafiek, de signatuurgrafiek van michi-vz, geïnspireerd op de fontein van Genève: één grafiek met een momentopname- en trendmodus. Experimenteel."
---
# Fontein (Jet d'Eau)

<span class="vp-badge warning">Experimenteel</span> <span class="vp-badge tip">Vergelijking</span>

::: warning Experimenteel - nog niet stabiel
In tegenstelling tot de andere 16 grafieken (die stabiel zijn), is de Fontein-grafiek **experimenteel**: de API, de visuele vormgeving en de vorm van `ChartContext` kunnen in toekomstige releases veranderen. Het is een storytelling- en communicatie-mark, geen precisie-analysetool - zie [Wanneer het zijn plek verdient](#when-the-fountain-earns-its-place). Zet een versie vast als je ervan afhankelijk bent.
:::

Genève pompt 500 liter per seconde de lucht in. Je fotografeert de straal. Je fotografeert nooit de tonnen water die ongezien terugvallen - de nevel waaruit de kolom eigenlijk bestaat. **De meeste cijfers hebben die vorm: een helder zichtbare piek, die rust op een verborgen massa die niemand erkent.** De Fontein-grafiek tekent beide tegelijk - het kopcijfer dat je rapporteert, en het ding dat het stilletjes ondermijnt (of juist ondersteunt).

- **De top van de piek is het getal** - lees het precies af van de y-as. Dat is het sterkste kanaal dat een grafiek heeft.
- **De nevel is een signaal, geen meetlat** - "dit bloedt / dit is wankel." Het *exacte* tweede getal staat in de tooltip en in `getContext()` (`spreadRatio`), nooit afgemeten aan de breedte van de pluim.

Het is dus een eerlijke **storytelling- en attributiegrafiek**: geboekte omzet versus weglekkende omzet, geborgde verkoop versus krimp, de sterren die je ziet versus de maintainers die je niet ziet. Het is geen precisie-analysetool - gebruik daarvoor [Fan](/nl/charts/fan) (onzekerheidsbanden), [Verticale gestapelde staven](/nl/charts/vertical-stack-bar) (sorteerbaar geborgd + risicovol), of een waterfall-grafiek. Zie [Wanneer het zijn plek verdient](#when-the-fountain-earns-its-place).

De standaard `style: "jet"` is de getrouwe Jet d'Eau: een hoge, smalle kolom, dicht aan de basis, die uitrafelt in een zachte kroon die met de wind meedrijft. Een symmetrischere `style: "plume"` (een rechtopstaande kolom met een vederachtige bloei en een nevelrand) is ook beschikbaar - zie [Twee silhouetten](#two-silhouettes).

<ChartDemo chart="fountain-chart" :legend="false" />

> Eén grafiek, twee modi - bepaald door het type x-as. Stel `xAxisDataType: "band"` in voor **Momentopname-modus**: één fontein per categorie, waarbij groottes naast elkaar worden vergeleken (fonteinen, steden, producten). Gebruik een temporele of numerieke x (`"date_annual"`, `"date_monthly"`, `"number"`) voor **Trendmodus**: een fontein per periode, waarbij de stijgende toppen de trend volgen terwijl elke pluim de volatiliteit van die periode toont, en een voorspellende fontein gestippeld wordt weergegeven met een bredere, schuimigere kroon.

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeFountain() {
  const dataSet = [];
  for (let i = 0; i < 400; i++) {
    const base = 40 + 60 * Math.sin(i / 11) + 20 * Math.sin(i / 3.3);
    const value = Math.max(5, Math.round(base + (i % 7) * 2));
    const spread = Math.max(1, Math.round(4 + 18 * Math.abs(Math.sin(i / 5)) + (i % 5)));
    const density = Math.min(1, 0.15 + (spread / 40));
    dataSet.push({
      label: `Jet ${i + 1}`,
      value,
      spread,
      density,
      ...(i % 47 === 0 ? { color: "#D4AF37" } : {}),
    });
  }
  return { dataSet, xAxisDataType: "band" };
}
</script>

FountainChart heeft een optionele `renderer="webgpu"` die de kolom en uitgerafelde pluim van elke fontein tekent als GPU-instanced marks, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo element="michi-vz-fountain-chart" :make="makeFountain" caption="400 jets" />

## Gebruik

::: code-group

```tsx [React]
import { FountainChart } from "@michi-vz/react";

export default () => <FountainChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { FountainChart } from "@michi-vz/vue";
</script>

<template>
  <FountainChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { fountainChart } from "@michi-vz/svelte";
</script>

<div use:fountainChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyFountainChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-fountain-chart #c></michi-vz-fountain-chart>
applyFountainChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, …
</script>
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Momentopname-modus (categorische x)

Geef `xAxisDataType: "band"` mee (of laat het weg; "band" is de standaardwaarde). Elk `dataSet`-item wordt één fontein, geplaatst in zijn eigen x-band. Dit is de vergelijkingsmodus: hoogtes beantwoorden "wat is groter?" en pluimbreedtes beantwoorden "wat is het meest onzeker?"

```ts
const props = {
  xAxisDataType: "band",
  dataSet: [
    { label: "Jet d'Eau",    value: 140, spread: 20 },
    { label: "King Fahd",    value: 312, spread: 35 },
    { label: "World Cup",    value: 185, spread: 15 },
    { label: "Bellagio",     value:  84, spread:  8 },
  ],
};
```

## Trendmodus (temporele of numerieke x)

Geef een temporele of numerieke `xAxisDataType` mee en voorzie elk item van een `date`. De fonteinen worden langs de tijdas geplaatst; een trendlijn verbindt hun toppen. Een item met `predicted: true` wordt gestippeld weergegeven met een zichtbaar schuimigere pluim - de voorspellingslook.

```ts
const props = {
  xAxisDataType: "date_annual",
  dataSet: [
    { label: "2020", date: 2020, value: 42, spread:  5 },
    { label: "2021", date: 2021, value: 51, spread:  6 },
    { label: "2022", date: 2022, value: 63, spread:  8 },
    { label: "2023", date: 2023, value: 70, spread: 10 },
    { label: "2024", date: 2024, value: 78, spread: 14, predicted: true },
    { label: "2025", date: 2025, value: 85, spread: 20, predicted: true },
  ],
};
```

::: warning Het best voor 5-12 perioden in trendmodus
Met veel datapunten worden de fonteinen samengedrukt en oogt de grafiek als een versierd lijndiagram - het detail van de pluim gaat verloren. Kies voor dichte tijdreeksen (20+ perioden) liever het [Waaierdiagram](/nl/charts/fan), dat onzekerheid weergeeft als vloeiende betrouwbaarheidsbanden. De Fontein schittert op menselijke schaal: een handvol perioden waarin elke pluim kan ademen.
:::

## Twee silhouetten {#two-silhouettes}

Stel `style` in om de vorm te kiezen; beide coderen dezelfde data (top = `value`, spreidingskanaal = `spread`).

- **`style: "jet"` (standaard)** - de getrouwe Jet d'Eau: een hoge, smalle kolom, dicht en ondoorzichtig aan de basis, die bovenaan **uitrafelt in een zachte, doorschijnende kroon** (opgebouwd uit lagen met oplopende transparantie; de kroonbreedte groeit met `spread`, het aantal lagen met de optionele `density`). `lean` (in [-1, 1]) laat de kroon **met de wind meedrijven**. Iconisch; het best als kopcijfer/KPI of vergelijking.
- **`style: "plume"`** - een symmetrische kolom die opbloeit tot een vederachtige kroon: `frothLayers`-schijven met oplopende transparantie bij de top, een zachte `showMist`-rand en `showDroplets`-baanbogen. `stemFraction` en `bloomExponent` stemmen het profiel van kolom naar kroon af. Overzichtelijker voor één enkele KPI waarbij de spreiding oogt als een betrouwbaarheidshalo.

```ts
const props = { style: "plume", dataSet: [{ label: "Q4", value: 78, spread: 20 }] };
```

Beide stijlen delen `stemFraction` (de halve breedte van de kolombasis als fractie van het vak), het veld `density`, en `lean`. Kleuren volgen jouw data/`colorsMapping`; het schuim/de nevel moduleert alleen de transparantie van jouw kleurtoon, zodat de grafiek zich aanpast aan lichte en donkere thema's.

## Wanneer de Fontein zijn plek verdient {#when-the-fountain-earns-its-place}

We hebben de literatuur gecheckt voordat we dit uitbrachten. De Jet d'Eau-metafoor is nieuw in dataviz (er bestaat geen eerdere fontein-/jetgrafiek), en het onderliggende idee is een gedegen heroriëntatie van de raincloud-/viool-/density-strip-familie. Maar de eerlijke taak ervan is **communicatie, geen meting** - gebruik het dus waar een gedenkwaardig kopcijfer-plus-zijn-verborgen-helft ertoe doet, en grijp naar een precisiegrafiek wanneer je het tweede getal exact moet vergelijken.

**Sterke toepassingen**

- **Kopcijfer versus verborgen erosie.** Geboekte versus weglekkende omzet (het gat tussen bruto- en netto-retentie), geborgde verkoop versus krimp, capaciteit versus verlies. Eén mark zegt: "dit is het getal, en dit is wat er onderuit wegbloedt." Dit is het vlaggenschipgebruik.
- **Hoog-maar-wankel / kunstmatig opgekrikt.** Een balk toont het niveau; de nevel voegt toe: "en zo kwetsbaar is het."
- **"Wat je ziet versus wat het kostte"** - storytelling over de zichtbare overwinning en het onzichtbare werk erachter. Het scoort goed op herkenning en onthouden (het enige waar onderzoek naar visuele versiering steun aan geeft).

**Gebruik het eerlijk**

- **De top is het enige wat lezers meten.** Zet het kopcijfer daar, op een echte, gelabelde y-as. Breedte en oppervlakte zijn kanalen met een lage nauwkeurigheid (mensen onderschatten ze), dus vraag nooit iemand om nevelbreedtes te vergelijken.
- **De nevel is een signaal; het cijfer is tekst.** Toon het exacte tweede getal in de tooltip / legenda / `getContext().jets[].spreadRatio`, en onderbouw het met een expliciet vastgestelde drempel (krimp > 2%, NRR < 100%, non-revenue water > 20%, P10-P90).
- **Begin met momentopname-modus**; beperk trendmodus tot een handvol perioden. Geef voor dichte of precieze onzekerheidsanalyse de voorkeur aan [Fan](/nl/charts/fan) (banden), [Verticale gestapelde staven](/nl/charts/vertical-stack-bar) (sorteerbaar geborgd + risicovol), of een waterfall-grafiek.
- Beperk het tot **5-12 symbolen** en sorteer momentopnames op `spreadRatio`, zodat het schuimigste item makkelijk te vinden is.

## API

Props zijn getypeerd als `FountainChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug. Volledige referentie: [Fountain API](/nl/api/fountain).
