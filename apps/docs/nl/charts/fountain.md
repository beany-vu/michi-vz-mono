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

## Anatomie: zo lees je een fontein

Elk zichtbaar onderdeel van het symbool heeft één vastgestelde betekenis. Niets anders draagt data.

- **Top** - HET getal. Die staat op een echte, gelabelde y-as en is het enige wat je meet.
- **Steel** - het lichaam van het getal. Decoratief; de breedte ervan codeert nooit iets.
- **Kroon / schuim** - het signaal: "dit is wankel / dit bloedt." Breed en schuimig betekent: kijk beter; het exacte tweede getal staat in de tooltip en in `getContext().jets[].spreadRatio`, nooit in de breedte die je ziet.
- **Symmetrische versus overhellende kroon** - symmetrie is een signaal. Een rechtopstaande kroon zegt dat de spreiding in balans is (het kan beide kanten op). Een overhellende kroon zegt dat de verborgen massa aan één kant hangt, een late staart, risico dat vooral naar beneden weegt. Lees alleen de richting af; het scheefheidscijfer staat in de tooltip (`jets[].lean`).
- **De wind** - een fontein die geen `lean` codeert, drijft toch zachtjes naar één kant. Die gedeelde drift is de signatuur van de Jet d'Eau (wind over het meer), puur decoratief: elke zo'n fontein drijft dezelfde kant op, en `lean` is `null` in de context.
- **Druppels en nevel** (plume-stijl) - decoratie; het aantal druppels schaalt met het optionele veld `density`.

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

FountainChart heeft een optionele `renderer="webgpu"` die de kolom en uitgerafelde pluim van elke fontein tekent als GPU-instanced marks, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend. De gedeelde zijwaartse drift die je bij de fonteinen ziet, is de decoratieve wind (geen van deze items codeert een `lean`), geen data.

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

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

## Praktijkgids: manieren om een fontein te lezen

De Fontein is nieuw, dus hier is het volledige repertoire, elke demo is een echte, live grafiek met een eerlijk bijschrift. De eerste vier zijn de vlaggenschiplezingen (het kopcijfer en wat het stilletjes ondermijnt of draagt); de rest generaliseert dezelfde grammatica naar zekerheid, stabiliteit, risico, AI en publiek.

### Geborgde verkoop versus krimp

Drie winkels boeken bijna identieke omzet, dus een staafdiagram zou ze gelijk noemen. De dikke, dichte pluim bij Winkel C signaleert waar diefstal en bederf de marge aantasten, en waar je preventie tegen verlies als eerste moet inzetten. Het krimppercentage staat in de tooltip; boven 2% van de omzet geldt het alarmniveau.

<ChartDemo chart="fountain-chart" :index="1" :legend="false" />

### Geleverd versus nooit gefactureerd (trend)

Trendmodus: het geleverde volume blijft stijgen, maar de verbredende pluim waarschuwt dat een groeiend aandeel nooit wordt gefactureerd, lekkages en ongemeten verbruik die de groei overtreffen. Onder 10% non-revenue water is goed; boven 20% betekent actie ondernemen.

<ChartDemo chart="fountain-chart" :index="2" :legend="false" />

### Een voorspelling die hoog maar wankel is

De trend stijgt, maar de voorspellende fonteinen rafelen uit tot gestippeld schuim: er wordt groei voorspeld, en het vertrouwen daarachter brokkelt snel af. Voor precieze banden is het [Waaierdiagram](/nl/charts/fan) het juiste gereedschap; dit is de gedenkwaardige versie van dezelfde waarschuwing.

<ChartDemo chart="fountain-chart" :index="3" :legend="false" />

### De sterren die je ziet, de maintainers die je niet ziet

De aanleiding waarvoor deze grafiek is gebouwd: de piek is wat iedereen ziet en van een ster voorziet; de nevel is de onzichtbare bijdragers waar het project eigenlijk op rust. Vergelijkbare bekendheid, heel verschillende fundamenten. Storytelling, geen meting.

<ChartDemo chart="fountain-chart" :index="4" :legend="false" />

### Hetzelfde getal, drie zekerheden

Drie teams schatten dezelfde 72 dagen tot lancering. Identieke toppen; alleen de pluim onderscheidt het team dat heeft gemeten van het team dat heeft gegokt. Het signaal zegt dat die 72 zacht is, de exacte marge hoort in de tooltip, en echte betrouwbaarheidsintervallen horen bij het [Waaierdiagram](/nl/charts/fan).

<ChartDemo chart="fountain-chart" :index="6" :legend="false" />

### Stabiel of wankel

Twee services zitten gemiddeld op 120 ms en twee op 60 ms, een staafdiagram toont twee identieke tweelingparen. De pluim maakt onderscheid binnen elk paar: de strakke kroon is die waarop je een SLO kunt zetten. Hier is een lagere top beter; vermeld dat expliciet in het bijschrift als je deze grafiek gebruikt. Dezelfde lezing werkt voor winst versus volatiliteit.

<ChartDemo chart="fountain-chart" :index="7" :legend="false" />

### Verwacht verlies versus het slechtste geval

De top is het verwachte verlies; de kroon reikt naar het stressscenario (`value + spread`, de `upperBound` in `getContext()`). Twee posities verwachten hetzelfde verlies; de ene verbergt een veel zwaardere staart. Lees het worstcasegetal af van de tooltip, nooit van de breedte.

<ChartDemo chart="fountain-chart" :index="8" :legend="false" />

### AI-antwoorden: zeker of gokken

De top is de antwoordscore; de pluim is de eigen onzekerheid van het model, genormaliseerd naar scoreeenheden zodat beide dezelfde y-as delen. Strakke kroon: veilig te automatiseren. Rafelende kroon: geef het door aan een mens. De [insights-laag](/nl/guide/insights) leest dezelfde `spreadRatio` uit `getContext()` om te vertellen welke antwoorden je kunt vertrouwen.

<ChartDemo chart="fountain-chart" :index="9" :legend="false" />

### Zelfde gemiddelde, verdeeld publiek

Twee artikelen scoren gemiddeld dezelfde 5,5 minuten betrokkenheid. Het ene houdt iedereen ongeveer even lang vast; het andere splitst zijn lezers tussen doorbladeraars en verslinders. Het gemiddelde verbergt die verdeling; de pluim signaleert het, en dat signaal is je aanwijzing om te segmenteren voordat je conclusies trekt.

<ChartDemo chart="fountain-chart" :index="10" :legend="false" />

### Aan welke kant hangt het risico

Symmetrie als signaal: drie routes delen dezelfde mediaan en dezelfde spreiding, maar één kroon helt over, de verrassingen zijn eenzijdig, een late staart (`lean: 0.8`). Rechtop (`lean: 0`) betekent in balans; overhellen betekent dat de verborgen massa aan die kant hangt. Lees alleen de richting af, nooit de hoek.

<ChartDemo chart="fountain-chart" :index="11" :legend="false" />

### Tyfoons boven de Filipijnen

Soms is de helling letterlijk. Elke straal is een tyfoon: de apex geeft de maximale aanhoudende wind, de nevel reikt naar de windstoten (dezelfde km/h), de dikte van het schuim toont de omvang van het windveld, en de kroon helt in de richting waarin de storm trok - Pacifische tyfoons steken de Filipijnen van oost naar west over, dus de hele rij helt naar links, en de storm die naar Japan afboog helt de andere kant op. Eén glyph, vier eerlijke kanalen, nul nieuwe grafiektypen.

<ChartDemo chart="fountain-chart" :index="12" :legend="false" />

## Twee silhouetten {#two-silhouettes}

Stel `style` in om de vorm te kiezen; beide coderen dezelfde data (top = `value`, spreidingskanaal = `spread`).

- **`style: "jet"` (standaard)** - de getrouwe Jet d'Eau: een hoge, smalle kolom, dicht en ondoorzichtig aan de basis, die bovenaan **uitrafelt in een zachte, doorschijnende kroon** (opgebouwd uit lagen met oplopende transparantie; de kroonbreedte groeit met `spread`, het aantal lagen met de optionele `density`). `lean` (in [-1, 1]) laat de kroon **met de wind meedrijven**. Iconisch; het best als kopcijfer/KPI of vergelijking.
- **`style: "plume"`** - een symmetrische kolom die opbloeit tot een vederachtige kroon: `frothLayers`-schijven met oplopende transparantie bij de top, een zachte `showMist`-rand en `showDroplets`-baanbogen. `stemFraction` en `bloomExponent` stemmen het profiel van kolom naar kroon af. Overzichtelijker voor één enkele KPI waarbij de spreiding oogt als een betrouwbaarheidshalo.

```ts
const props = { style: "plume", dataSet: [{ label: "Q4", value: 78, spread: 20 }] };
```

<ChartDemo chart="fountain-chart" :index="5" :legend="false" />

**Vuistregel: plume voor weinig fonteinen, jet voor de hoofdgrafiek en voor zware datasets.** Op menselijke schaal (1 tot 12 fonteinen) is de symmetrische, gelaagde kroon van de plume de makkelijkst leesbare vorm om het symptoom af te lezen, strakke halo versus brede schuimkraag. Bij honderden fonteinen wordt de bloei van de plume samengeperst tot een flintertje van het vak en verwordt hij tot een simpele staaf, terwijl de op-de-kolom-gerichte jet gracieus vervalt tot een hoge strook (zie de demo met zware data hierboven); die draagt bovendien het merk. Grijp voor werkelijk dichte reeksen niet naar meer versiering, maar naar het [Waaierdiagram](/nl/charts/fan).

**Symmetrie draagt betekenis.** Een rechtopstaande kroon (de plume-stijl, of een fontein met `lean: 0`) zegt dat de spreiding in balans is. Een overhellende kroon (`lean` in [-1, 1], alleen het teken telt) zegt dat de spreiding aan één kant hangt. Een fontein **zonder** `lean` behoudt een zachte decoratieve drift, de wind van Genève, en meldt `lean: null` in de context, zodat gebruikers signaal van versiering kunnen onderscheiden.

Beide stijlen delen `stemFraction` (de halve breedte van de kolombasis als fractie van het vak), het veld `density`, en `lean`. Kleuren volgen jouw data/`colorsMapping`; het schuim/de nevel moduleert alleen de transparantie van jouw kleurtoon, zodat de grafiek zich aanpast aan lichte en donkere thema's.

## Wanneer de Fontein zijn plek verdient {#when-the-fountain-earns-its-place}

De literatuur is gecheckt voordat deze grafiek werd uitgebracht. De Jet d'Eau-metafoor is nieuw in dataviz (er bestaat geen eerdere fontein-/jetgrafiek), en het onderliggende idee is een gedegen heroriëntatie van de raincloud-/viool-/density-strip-familie. Maar de eerlijke taak ervan is **communicatie, geen meting** - gebruik het dus waar een gedenkwaardig kopcijfer-plus-zijn-verborgen-helft ertoe doet, en grijp naar een precisiegrafiek wanneer je het tweede getal exact moet vergelijken.

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
