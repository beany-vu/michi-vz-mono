---
title: Fontein (Jet d'Eau) API
---

# Fontein (Jet d'Eau) API

Eén grafiek, twee modi: tophoogte = waarde, opbloeiende pluim = onzekerheid. Categorische x = momentopname/vergelijking; temporele of numerieke x = trend - zie de **[Fontein-demo](/nl/charts/fountain)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/fountain-chart";
// <michi-vz-fountain-chart> is now defined
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
```

:::

## Props

<PropsTable chart="fountain-chart" />

::: tip Twee modi, één datavorm
Stel `xAxisDataType: "band"` in (of laat het weg) voor de **Momentopname-modus** - elk item krijgt zijn eigen x-band, naast elkaar. Geef een temporele of numerieke `xAxisDataType` op plus een `date` bij elk item voor de **Trend-modus** - de jets worden langs de tijdas geplaatst en een trendlijn verbindt hun toppen. Een item met `predicted: true` wordt gestippeld weergegeven met een schuimigere kroon.
:::

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert (jet-label) |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd (bijv. een niet-eindige waarde of spreiding) |

## getContext()

`mountFountainChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`FountainChartContext`**:

- **`mode`** - `"snapshot"` voor een categorische/band-x, `"trend"` voor een temporele/numerieke x.
- **`jets`** - één item per zichtbare jet: `{ label, code?, color, value, spread, upperBound, spreadRatio, predicted, xPosition }`. `upperBound` = `value + spread`; `spreadRatio` = `spread / value` (relatieve onzekerheid); `xPosition` is de ruwe datum/het ruwe getal in trend-modus, of `null` in momentopname-modus.
- **`stats`** - samenvattend object:
  - `jetCount` - aantal zichtbare jets.
  - `tallest` - `{ label, value }` van de hoogste jet, of `null` indien leeg.
  - `frothiest` - `{ label, spreadRatio }` van de meest onzekere jet, of `null` indien leeg.
  - `trendSlope` - helling van een lineaire regressie door de jet-waarden op index in trend-modus; `null` in momentopname-modus.
  - `valueRange` - `[min, max]` van de jet-waarden, of `null` indien leeg.
  - `predictedCount` - aantal voorspelde jets.

Zie [LLM-context](/nl/guide/llm-context) voor hoe je de context gebruikt in prompts en rapporten.

## Bron

Props zijn getypeerd als [`FountainChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
