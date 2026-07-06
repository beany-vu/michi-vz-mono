---
title: Choroplethenkaart API
---

# Choroplethenkaart API

Een wereld-/regiokaart met choropleten: je eigen GeoJSON, gekleurd via een drempel-kleurschaal of een expliciete categoriekaart - zie de **[Choroplethenkaart-demo](/nl/charts/choropleth-map)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/choropleth-map-chart";
// <michi-vz-choropleth-map-chart> is now defined
```

```ts [Vanilla JS]
import { mountChoroplethMapChart } from "@michi-vz/core";

const chart = mountChoroplethMapChart(el, props);
```

:::

## Props

<PropsTable chart="choropleth-map-chart" />

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | waarschuwingen worden gedetecteerd (niet-gekoppelde dataSet-ids, features zonder id, ongeldige geometrie) |

## getContext()

`mountChoroplethMapChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`ChoroplethMapChartContext`**: `stats.featureCount` / `matchedCount` / `unmatchedCount` / `valueDomain` / `lowest` / `highest`, een `regions[]`-array (één rij per feature: `id`, `label`, `value?`, `color`, `matched`), de opgeloste `projection`-naam, een deterministische samenvatting in gewone taal, en een `a11yTable` met elke regio + waarde + koppelingsstatus. Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`ChoroplethMapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
