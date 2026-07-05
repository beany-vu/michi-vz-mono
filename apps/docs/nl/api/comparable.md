---
title: Vergelijkbare staven API
---

# Vergelijkbare staven API

Twee waarden per label, basis versus vergeleken, zodat verschuivingen van voor/na in één oogopslag duidelijk zijn - zie de **[Vergelijkbare-staven-demo](/nl/charts/comparable)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/comparable-horizontal-bar-chart";
// <michi-vz-comparable-horizontal-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountComparableHorizontalBarChart } from "@michi-vz/core";

const chart = mountComparableHorizontalBarChart(el, props);
```

:::

## Props

<PropsTable chart="comparable-horizontal-bar-chart" />

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountComparableHorizontalBarChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`ComparableBarChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`ComparableBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
