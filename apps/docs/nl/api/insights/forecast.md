---
title: Forecast API
---

# Forecast API

Een plugin die van elke tijdgrafiek een prognose maakt, die toekomstige stappen projecteert met een betrouwbaarheidsband; voor het volledige verhaal, zie de **[Insights-gids](/nl/guide/insights)**.

Probeer het - schakel de prognose, de band en de verteller aan of uit:

<InsightsDemo feature="forecast" />

## Import

```ts
import { forecast } from "@michi-vz/insights/forecast";
```

`forecast(options?)` retourneert een plugin die je meegeeft in de mount-opties van de grafiek. Het werkt op Line-, Fan-, Range-, Area-, Vertical-Stack-Bar-, Ribbon- en Bar-Bell-grafieken.

```ts
mountLineChart(el, props, { plugins: [forecast({ horizon: 4 })] });
```

## Signatuur & opties

| Naam | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `method` | `"holt-winters"` of `"linear"` (lazy `"arima"`) | `"holt-winters"` | Prognosemodel dat wordt gebruikt om toekomstige stappen te projecteren. |
| `horizon` | `number` | `4` | Aantal toekomstige stappen om te voorspellen. |
| `level` | `number` | `0.95` | Betrouwbaarheidsniveau voor de voorspellingsband. |
| `levels` | `number[]` | optioneel | Extra geneste bandniveaus voor een fan-grafiek. |
| `target` | `string` of `string[]` | alle | Beperk de prognose tot deze serielabels. |
| `scenarios` | `Array<{ name: string; growth: number }>` | optioneel | What-if-lijnen getekend op basis van aangepaste groeipercentages. |
| `trendline` | `boolean` | `false` | Overlay een regressielijn. |
| `threshold` | `{ value: number; label?: string }` | optioneel | Referentielijn plus een geprojecteerd "omslagpunt". |
| `onThresholdBreach` | `(b) => void` | optioneel | Wordt geactiveerd wanneer de prognose naar verwachting de drempel overschrijdt. |
| `zone` | `boolean` | `true` | Arceer het prognosegebied om voorspelling versus werkelijkheid te benadrukken. |

Ook geëxporteerd vanuit dit subpad: `forecastFan(history, options?, label?)`, `computeForecast`, `decompose`, `detectPeriod`, `detectChangepoints`, `monteCarloForecast`, `requiredGrowth`, `requiredRunRate`, `pacingToGoal`, en `FORECASTABLE_CHARTS`.

## Voorbeeld

```ts
import { mountLineChart } from "@michi-vz/core";
import { forecast } from "@michi-vz/insights/forecast";

mountLineChart(el, props, {
  plugins: [
    forecast({
      method: "holt-winters",
      horizon: 4,
      threshold: { value: 200, label: "Target" },
      zone: true,
    }),
  ],
});
```

**[Insights-gids](/nl/guide/insights)**
