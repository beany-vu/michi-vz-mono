---
title: Sankey API
---

# Sankey API

Stromen tussen knooppunten, uitgelijnd in kolommen, met een banddikte die evenredig is aan de waarde van de stroom (gebouwd op d3-sankey) - zie de **[Sankey-demo](/nl/charts/sankey)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/sankey-chart";
// <michi-vz-sankey-chart> is now defined
```

```ts [Vanilla JS]
import { mountSankeyChart } from "@michi-vz/core";

const chart = mountSankeyChart(el, props);
```

:::

## Eigenschappen

<PropsTable chart="sankey-chart" />

::: tip Data bestaat uit twee arrays
In tegenstelling tot de andere diagrammen gebruikt een Sankey `nodes` (`{ id, label?, color? }[]`) en `links` (`{ source, target, value }[]`) in plaats van één enkele `dataSet`.
:::

## Gebeurtenissen

Het webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Wordt geactiveerd wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de hover-markering verandert (node-ID, of de bron + het doel van een link) |
| `michi-vz:colormapping` | `Record<string, string>` | een kleurmapping wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | data (opnieuw) wordt verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd (bijv. een link naar een onbekend knooppunt) |

## getContext()

`mountSankeyChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`SankeyChartContext`**: de `nodes` (id / label / kleur / waarde / kolomdiepte), de `links` (source / target / waarde / kleur), samenvattende statistieken (aantal knooppunten en links, aantal kolommen, totale stroom, grootste link, drukste knooppunt), een deterministische samenvatting in gewone taal, en een a11y-tabel met de stromen. Zie [LLM-context](/nl/guide/llm-context).

## Bron

Eigenschappen zijn getypeerd als [`SankeyChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
