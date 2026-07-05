---
title: Lijndiagram API
---

# Lijndiagram API

Alles wat je nodig hebt om een lijndiagram in code op te zetten; voor het verhaal en de demo's, zie de **[Lijndiagram-demo](/nl/charts/line)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/line-chart";
// <michi-vz-line-chart> is now defined
```

```ts [Vanilla JS]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, props);
```

:::

## Eigenschappen

<PropsTable chart="line-chart" />

## Raster- en asweergave

Vier eigenschappen bepalen de dichtheid van de y-astickmarks en het tekenen van rasterlijnen:

| Eigenschap | Standaardwaarde | Opmerkingen |
| --- | --- | --- |
| `yTicks` | `10` | Geschat aantal tickmarks op de y-as. De oorspronkelijke standaardwaarde was 10; kies een lagere waarde (bijv. `5`) voor een as met minder tickmarks. |
| `showGridLines` | `true` | Horizontale onderbroken rasterlijnen bij elke y-tick. |
| `showVerticalGridLines` | `false` | Verticale onderbroken rasterlijnen bij elke x-tick. Het legacy-diagram tekende deze niet; schakel dit alleen in wanneer de extra hulplijnen de leesbaarheid ten goede komen. |
| `highlightZeroLine` | `true` | Tekent de y=0-lijn als een doorgetrokken lijn (gekleurd via `--michi-vz-zero-line`, met terugval op de rasterkleur) in plaats van een gewone onderbroken tick. Handig wanneer een dataset zowel positieve als negatieve waarden bevat. |

## Laad- en 'geen data'-status

De engine beheert een `data-mv-state`-attribuut op het host-element met drie mogelijke waarden - `"loading"`, `"nodata"` en `"ready"` - en toont voor de eerste twee ingebouwde overlays, tenzij je dit uitschakelt.

| Eigenschap | Type | Standaardwaarde | Opmerkingen |
| --- | --- | --- | --- |
| `isLoading` | `boolean` | `false` | Toont de `.mv-loading`-overlay en slaat de controle op geen data volledig over. |
| `isNodata` | `boolean \| (dataSet) => boolean` | - | Overschrijft het standaardpredicaat (lege `dataSet` of elke serie heeft nul punten). Geef `false` door om het diagram te forceren te renderen, ook wanneer de data leeg lijkt. |
| `noDataLabel` | `string` | - | Tekst die wordt getoond in de standaard `.mv-nodata`-overlay. Wordt genegeerd wanneer `suppressDefaultOverlay` `true` is. |
| `suppressDefaultOverlay` | `boolean` | `false` | Voorkomt dat de engine zijn eigen laad-/geen-data-node injecteert. Gebruik dit wanneer een framework-wrapper (bijv. de `LineChart` van `@michi-vz/react`) in plaats daarvan `isLoadingComponent` / `isNodataComponent` als React-overlay rendert. De host wordt nooit unmount - de overlay wordt er alleen bovenop gelegd. |

::: tip Gedrag van de React-wrapper
De `LineChart` van `@michi-vz/react` stelt automatisch `suppressDefaultOverlay` in en rendert `isLoadingComponent` / `isNodataComponent` als een gepositioneerde React-node boven de host van het diagram. De DOM van het diagram is altijd gemount, dus `isNodataComponent` wordt ook bij lege data nog altijd geactiveerd, zelfs zonder aangepast predicaat.
:::

## Lettertypefamilie

`fontFamily` stelt de CSS custom property `--michi-vz-font-family` in op het host-element; deze wordt gelezen door zowel de SVG-tekstrenderer als de `getComputedStyle`-probe van canvas. Het lettertype moet al door de pagina geladen zijn - er wordt geen lettertype ingebed.

## ChartContext / legendData

`onChartDataProcessed` ontvangt een `LineChartContext` die `BaseChartContext` uitbreidt. De basis bevat nu een `legendData`-veld:

```ts
interface LegendItem {
  label: string;         // series label as it appears in dataSet
  color: string;         // resolved colour at the time of processing
  order: number;         // appearance order (legend slot index)
  disabled?: boolean;    // true when the label is currently hidden
  dataLabelSafe?: string; // sanitizeForClassName(label) - the CSS hook the canvas colour probe matches
}

interface BaseChartContext {
  // ... existing fields ...
  legendData?: LegendItem[]; // populated by LineChart; treat absence as []
}
```

`legendData` is de canonieke payload voor kleurautoriteiten aan de kant van de consument. Een framework-wrapper die zijn eigen kleur-CSS aanstuurt (bijv. `useChartUtils` van thd MonitorV2) leest bij elke aanroep van `onChartDataProcessed` `legendData[].{label, dataLabelSafe, color, disabled}` en genereert per label `stroke`/`fill`-regels die het `data-label-safe`-attribuut targeten. Dit maakt het niet langer nodig om `colorsMapping` te kruisverwijzen met de volgorde van de series.

## Gebeurtenissen

Het webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Wordt geactiveerd wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de hover-markering verandert |
| `michi-vz:colormapping` | `Record<string, string>` | een kleurmapping wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | data (opnieuw) wordt verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountLineChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`LineChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Eigenschappen zijn getypeerd als [`LineChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
