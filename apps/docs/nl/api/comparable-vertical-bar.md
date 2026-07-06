---
title: Vergelijkbare verticale staven API
---

# Vergelijkbare verticale staven API

Twee waarden per categorie, basis versus vergeleken, als volledig overlappende kolommen met een optionele verschilpijl boven elk paar - zie de **[Vergelijkbare-verticale-staven-demo](/nl/charts/comparable-vertical-bar)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/comparable-vertical-bar-chart";
// <michi-vz-comparable-vertical-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountComparableVerticalBarChart } from "@michi-vz/core";

const chart = mountComparableVerticalBarChart(el, props);
```

:::

## Props

<PropsTable chart="comparable-vertical-bar-chart" />

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountComparableVerticalBarChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`ComparableVerticalBarChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Anders dan ComparableHorizontalBarChart weerspiegelt deze context de `deltaIndicator` wanneer actief: `series[].deltaDirection` / `deltaColor` / `deltaLabel`, en `stats.grew` / `stats.shrank` / `stats.unchanged` / `stats.improved` / `stats.worsened`. Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`ComparableVerticalBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
