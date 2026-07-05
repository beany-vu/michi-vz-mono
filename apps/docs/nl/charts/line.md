---
title: Lijndiagram
description: "Lijndiagram voor tijdreeksen: één reeks of vijftig, ontbrekende periodes weergegeven als streepjes, en een optionele canvas-renderer met LTTB-decimatie voor duizenden punten."
---
# Lijndiagram

<span class="vp-badge tip">Trends</span>

"Hoe is dit door de tijd heen verlopen, en waar kan ik de data niet vertrouwen?" Eén reeks of vijftig, met ontbrekende periodes weergegeven als streepjes zodat een hiaat in de rapportage nooit als een echte dip wordt gelezen - plus een optionele canvas-renderer (LTTB-gedecimeerd voor grote datasets) wanneer het aantal punten in de duizenden loopt.

<ChartDemo chart="line-chart" />

> De grafiek hierboven is dezelfde **engine** in elk framework - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Het verloop van een KPI volgen.** Omzet per maand, gebruikers per week, latentie per uur - overal waar "hoe is dit bewogen?" de vraag is, beantwoordt de lijn die sneller dan welke tabel dan ook.
- **Een handvol reeksen op één schaal vergelijken**, met hiaten in de rapportage eerlijk weergegeven: een ontbrekende periode wordt getoond als een streepje, nooit als een valse dip waar een directielid op zou kunnen reageren.
- **Ook bij grote datasets.** Duizenden punten blijven soepel dankzij de optionele canvas-renderer (LTTB-decimatie). Maar als het verhaal een voorspelling is in plaats van historie, toont het [waaierdiagram](/nl/charts/fan) de bandbreedte, niet alleen de lijn.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeLine() {
  const seriesLabels = [
    { label: "Germany", color: "#1f9e57" },
    { label: "United Kingdom", color: "#2c6fbb" },
    { label: "France", color: "#e63946" },
    { label: "Spain", color: "#e9c46a" },
    { label: "Italy", color: "#2a9d8f" },
    { label: "Poland", color: "#9b5de5" },
    { label: "Sweden", color: "#f4a261" },
    { label: "Netherlands", color: "#264653" },
  ];
  const POINTS_PER_SERIES = 2000;
  const START_YEAR = 1900;
  const dataSet = seriesLabels.map((s, si) => {
    let value = 20 + si * 5;
    const series = [];
    for (let i = 0; i < POINTS_PER_SERIES; i++) {
      value += (Math.random() - 0.5) * 2;
      value = Math.max(0, Math.min(100, value));
      series.push({
        date: START_YEAR + i,
        value: Math.round(value * 100) / 100,
        certainty: true,
      });
    }
    return { label: s.label, color: s.color, series };
  });
  return { dataSet, xAxisDataType: "date_annual", showDataPoints: false };
}

function makeNoDataLine() {
  // 24 months of Jan 2022 - Dec 2023, but several months are MISSING from the data
  // (2022-04/05/09, 2023-02/03) so the "fill" toggle has real gaps to reveal.
  const present = [
    "2022-01", "2022-02", "2022-03", "2022-06", "2022-07", "2022-08",
    "2022-10", "2022-11", "2022-12", "2023-01", "2023-04", "2023-05",
    "2023-06", "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  ];
  const mk = (base, amp) =>
    present.map((date, i) => ({
      date,
      value: Math.round((base + Math.sin(i / 2) * amp) * 10) / 10,
      certainty: true,
    }));
  return {
    dataSet: [
      { label: "Exports", color: "#2c6fbb", series: mk(60, 12) },
      { label: "Imports", color: "#e07b39", series: mk(45, 9) },
    ],
    xAxisDataType: "date_monthly",
    xAxisFormat: (d) => {
      const dt = new Date(Number(d));
      return (
        dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) +
        " " +
        String(dt.getUTCFullYear()).slice(2)
      );
    },
    noDataTickTooltip: () => "No data reported for this month",
  };
}
</script>

De optionele `renderer="webgpu"` van het lijndiagram tekent de lijn-/markergeometrie op de GPU, terwijl assen, labels en tooltips op de SVG-laag blijven; dit is capability-gated met automatische terugval naar canvas wanneer WebGPU niet beschikbaar is.

<WebgpuHeavyDemo legend element="michi-vz-line-chart" :make="makeLine" caption="~16,000 points" />

## Detectie van hiaten

Een ontbrekende periode wordt weergegeven als een **gestreept** segment - stel dit per punt in met `certainty: false`, of laat `detectGaps` het automatisch afleiden. Hier slaat één reeks een rapportageperiode over:

<ChartDemo chart="line-chart" :index="1" />

## Doorlopende tijdlijn en no-data-ticks

Standaard is de x-as op twee manieren eerlijk over tijd: **de eerste en laatste periode worden nooit weggelaten** (zelfs niet als ze op een "onronde" maand vallen die d3 anders zou overslaan), en overvolle labels kantelen naar -45° en worden vervolgens uitgedund tot ongeveer 5 - waarbij beide uiteinden altijd behouden blijven.

Schakel `fillPeriodTicks` in en de as tekent een tick voor **elke** periode binnen het bereik, niet alleen die met data. Maanden zonder waarde worden **vervaagd** weergegeven; hover erover om het hiaat toe te lichten. Zet de schakelaar om:

<NoDataTicksDemo :make="makeNoDataLine" />

Pas het aan: `noDataTickTooltip(epochMs)` retourneert de tooltiptekst (platte string of gesaniteerde HTML), en `noDataTickColor` (of de CSS-variabele `--michi-vz-tick-nodata`) stelt de vervaagde kleur in.

::: code-group

```tsx [React]
<LineChart
  {...props}
  xAxisDataType="date_monthly"
  fillPeriodTicks
  noDataTickTooltip={() => "No data reported for this month"}
  noDataTickColor="#c0392b"
/>
```

```vue [Vue]
<LineChart :options="{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }" />
```

```svelte [Svelte]
<div use:lineChart={{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }}></div>
```

```ts [Angular]
applyLineChartProps(this.c.nativeElement, {
  ...props,
  fillPeriodTicks: true,
  noDataTickTooltip: () => "No data",
});
```

```html [Web component]
<michi-vz-line-chart id="c" fill-period-ticks no-data-tick-color="#c0392b"></michi-vz-line-chart>
<script>
  document.getElementById("c").noDataTickTooltip = () => "No data reported";
</script>
```

:::

## Gebruik

::: code-group

```tsx [React]
import { LineChart } from "@michi-vz/react";

export default () => <LineChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { LineChart } from "@michi-vz/vue";
</script>

<template>
  <LineChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { lineChart } from "@michi-vz/svelte";
</script>

<div use:lineChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyLineChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-line-chart #c></michi-vz-line-chart>
applyLineChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-line-chart id="c"></michi-vz-line-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Laadstatus en 'geen data'-status

Geef `isLoading` door terwijl je data-fetch nog bezig is; de engine toont een `.mv-loading`-overlay en zet `data-mv-state="loading"` op de host.

Wanneer de fetch niets oplevert, neemt `isNodata` het over. Het standaardpredicaat behandelt een lege `dataSet` (of elke reeks die leeg is) als geen data - je kunt dit overschrijven met een boolean of een functie:

```tsx [React]
// boolean shortcut
<LineChart isLoading={query.isPending} isNodata={query.data?.length === 0} noDataLabel="No data available" />

// function predicate
<LineChart isNodata={(ds) => ds.every(s => s.data.length === 0)} />
```

In React accepteren de props `isNodataComponent` en `isLoadingComponent` elke `ReactNode`. De engine blijft gemount (zodat `onChartDataProcessed` nog steeds wordt getriggerd); jouw node wordt als overlay boven op de chart-host gerenderd, en `suppressDefaultOverlay` wordt automatisch ingesteld zodat het ingebouwde `.mv-nodata`-bericht verborgen blijft:

```tsx [React]
<LineChart
  isLoading={isPending}
  isLoadingComponent={<Spinner />}
  isNodata={isEmpty}
  isNodataComponent={<p className="no-data">No results for this selection.</p>}
/>
```

Voor vanilla JS / andere frameworks wordt de ingebouwde overlay standaard getoond. Onderdruk deze en render je eigen node naast de chart-host:

```ts [Vanilla JS]
const chart = mountLineChart(el, { ...props, suppressDefaultOverlay: true });
// render your overlay next to el when data-mv-state === "nodata"
```

## Asconfiguratie

| Prop | Standaard | Effect |
|---|---|---|
| `yTicks` | `10` | Aantal tick-intervallen op de y-as |
| `showGridLines` | `true` | Horizontale (y) gestreepte rasterlijnen |
| `showVerticalGridLines` | `false` | Verticale (x) gestreepte rasterlijnen |
| `highlightZeroLine` | `true` | Tekent y = 0 als een doorgetrokken lijn |

De kleur van de nullijn valt standaard terug op de rasterkleur (`--michi-vz-grid`). Overschrijf deze onafhankelijk:

```css
.my-chart-host {
  --michi-vz-zero-line: #e53935; /* solid red zero line */
  --michi-vz-grid: #e0e0e0;      /* dashed gridlines stay grey */
}
```

```tsx [React]
<LineChart
  yTicks={5}
  showGridLines={true}
  showVerticalGridLines={false}
  highlightZeroLine={true}
/>
```

## Lettertypefamilie

Geef `fontFamily` door om SVG-labels en canvas-tekst gesynchroniseerd te houden. De engine schrijft `--michi-vz-font-family` op de chart-host; zowel de SVG-`<text>`-elementen als het canvas `ctx.font`-pad lezen die berekende stijl, dus is geen font-embedding vereist - het lettertype hoeft alleen al door de pagina te zijn geladen.

```tsx [React]
<LineChart fontFamily="Inter, sans-serif" />
```

```ts [Vanilla JS]
mountLineChart(el, { ...props, fontFamily: "Inter, sans-serif" });
```

## Kleuren en legendagegevens

Lijnkleuren volgen het **CSS-contract van `data-label-safe`**. Elk reekselement draagt een `data-label-safe`-attribuut (het gesaniteerde reekslabel); je richt je hierop in CSS om de streepkleur (stroke) in te stellen. De canvas-renderer meet die berekende stijlen op het moment van renderen, zodat dezelfde CSS-regels beide renderers aansturen.

`onChartDataProcessed` (en `getContext()`) geven een `legendData`-array door op de [ChartContext](/nl/guide/llm-context). Elke entry heeft `{ label, color, order, disabled?, dataLabelSafe }`. Een kleurautoriteit (bijvoorbeeld een provider-component) kan deze entries lezen en de bijbehorende CSS genereren:

```tsx [React]
<LineChart
  onChartDataProcessed={(ctx) => {
    ctx.legendData?.forEach(({ dataLabelSafe, color }) => {
      // write `.line[data-label-safe="${dataLabelSafe}"] { stroke: ${color} }` into a <style> tag
    });
  }}
/>
```

## API

Props zijn getypeerd als `LineChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-agnostische [ChartContext](/nl/guide/llm-context).
