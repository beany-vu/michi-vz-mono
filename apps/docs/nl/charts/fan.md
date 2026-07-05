---
title: Waaierdiagram
description: "Waaierdiagram voor voorspellingen met onzekerheid: een doorgetrokken historielijn, een gestippeld meest-waarschijnlijk pad en betrouwbaarheidsbanden die breder worden richting de toekomst."
---
# Waaierdiagram

<span class="vp-badge tip">Trends</span> <span class="vp-badge tip">Voorspelling</span>

**"Wat wordt de omzet volgend kwartaal?"** Het eerlijke antwoord is nooit één getal - het is een *bereik*, en dat bereik is precies waar het om draait. Geef een leidinggevende één getal en je gokt; geef diegene deze waaier en je vertelt de waarheid over het risico. De doorgetrokken lijn is wat al gebeurd is, de gestippelde lijn is het ene meest-waarschijnlijke pad, en de gearceerde banden tonen hoe zeker de voorspelling is - ze worden breder naarmate ze verder de toekomst in reiken, want hoe verder vooruit je kijkt, hoe minder iemand kan weten.

<ChartDemo chart="fan-chart" :height="380" />

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeFan() {
  const n = 1500;
  const dataSet = [];
  const bands = [];
  let level = 100;
  const cutoff = Math.round(n * 0.85);
  for (let i = 0; i < n; i++) {
    level += (Math.random() - 0.48) * 2 + Math.sin(i / 40) * 0.6;
    const certainty = i < cutoff;
    dataSet.push({ date: i, value: Math.round(level * 100) / 100, certainty });
    if (!certainty) {
      const h = i - cutoff + 1;
      const spread = Math.sqrt(h) * 1.8;
      bands.push({ date: i, valueMin: Math.round((level - spread) * 100) / 100, valueMax: Math.round((level + spread) * 100) / 100, valueMedium: Math.round(level * 100) / 100 });
    } else {
      bands.push({ date: i, valueMin: level, valueMax: level, valueMedium: level });
    }
  }
  return {
    dataSet: [
      {
        label: "Revenue",
        color: "#2563eb",
        series: dataSet,
        bands: [{ level: 0.95, series: bands }],
      },
    ],
    xAxisDataType: "number",
    fillOpacity: 0.22,
  };
}
</script>

De optionele `renderer="webgpu"` van FanChart tekent de lijn- en band-marks op de GPU, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo element="michi-vz-fan-chart" :make="makeFan" caption="~1,500 points" />

## Hoe je het leest

- **Doorgetrokken lijn - historie.** De werkelijke cijfers die je al hebt.
- **Gestippelde lijn - het meest-waarschijnlijke pad** (de voorspelde *mediaan*): één beste inschatting, nooit het hele verhaal.
- **Geneste banden - betrouwbaarheid.** Van binnen naar buiten = **50% / 80% / 95%**. De werkelijke waarde zou ongeveer **19 van de 20 keer** binnen de 95%-band moeten vallen. Je plant tegen de band, niet tegen de lijn.
- **Waarom het uitwaaiert.** Volgende maand is redelijk te overzien; een jaar verder niet. Onzekerheid stapelt zich op met de afstand, dus de banden worden breder.

> Lees je **worstcasescenario** af aan de onderkant van de buitenste band en je **bestcasescenario** aan de bovenkant. De waaier is je basis-/opwaarts-/neerwaarts-scenario in één enkel beeld - geen apart scenariotabblad nodig.

## De wiskunde, in gewone taal

Je hebt de vergelijkingen niet nodig om de grafiek te gebruiken, maar dit is wat er onder de motorkap zit - en waarom je het kunt vertrouwen:

- **De mediaan** komt van **Holt-Winters** exponentiële afvlakking. Het volgt twee bewegende grootheden, het huidige **niveau** en de **trend** (helling), en rolt ze vooruit; als de reeks een terugkerend seizoenspatroon heeft, volgt het dat ook. (Liever een rechte lijn? `method: "linear"` past in plaats daarvan een gewone kleinste-kwadratenregressie toe.)
  > `ℓₜ = α·yₜ + (1−α)(ℓₜ₋₁ + bₜ₋₁)` · `bₜ = β(ℓₜ − ℓₜ₋₁) + (1−β)bₜ₋₁` · `ŷₜ₊ₕ = ℓₜ + h·bₜ`
- **De banden** komen uit de *eigen historische fouten* van het model. Het meet hoezeer de gefitte waarden misten (de residuspreiding `σ`) en verbreedt het interval als `ŷ ± z·σ·√h` - `z = 1.96` voor 95%, en de `√h` is precies waarom de waaier zich opent met de horizon `h`.
- **Kun je het vertrouwen?** Een **backtest** verbergt de laatste paar echte punten, voorspelt ze opnieuw en rapporteert de fout (`MAPE`, `RMSE`). Zo krijg je een eerlijkheidsscore *voordat* je op het getal wedt, niet erna.

Dit alles draait **in de browser** - geen data-science-backend, geen serverronde. (Power BI voorspelt, ter vergelijking, alleen op een lijndiagram en stopt precies waar echte modellering begint.)

> Bouw de data in één aanroep met `forecastFan()` uit [`@michi-vz/insights/forecast`](/nl/guide/insights), of geef het `series` (historie + mediaan met `certainty:false`) en geneste `bands` mee.

## Gebruik

::: code-group

```ts [Insights (one call)]
import { mountFanChart } from "@michi-vz/core";
import { forecastFan } from "@michi-vz/insights/forecast";

// history = DataPoint[] of actuals; build the fan (median + 50/80/95% bands)
const item = forecastFan(history, { method: "holt-winters", horizon: 4, levels: [0.5, 0.8], level: 0.95 }, "Revenue");
const chart = mountFanChart(el, { dataSet: [item], xAxisDataType: "date_annual" });
```

```ts [Vanilla JS]
import { mountFanChart } from "@michi-vz/core";

const chart = mountFanChart(el, props); // props.dataSet = FanDataItem[]
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-fan-chart id="c"></michi-vz-fan-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet (series + bands), title, …
</script>
```

:::

## Datavorm

Een `FanDataItem` is een vertrouwde lijnreeks plus geneste banden:

```ts
interface FanDataItem {
  label: string;
  color?: string;
  series: DataPoint[];   // history (certainty:true) then forecast median (certainty:false → dashed)
  bands: { level: number; series: RangeDataPoint[] }[]; // drawn widest-first, graduated opacity
}
```

## API

Props zijn getypeerd als `FanChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) en spiegelen `LineChartProps` (`width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer`, `highlightItems`, `disabledItems`, `fillOpacity` en de `on*`-callbacks). `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.
