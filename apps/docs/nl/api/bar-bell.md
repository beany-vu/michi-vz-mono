---
title: Halterdiagram API
---

# Halterdiagram API

Koppel segmenten binnen elke rij aan elkaar om precies te zien waar het aandeel van elke stap in het totaal terechtkomt - props, events en engine hieronder; zie het in beweging op de **[Halterdiagram-demo](/nl/charts/bar-bell)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/bar-bell-chart";
// <michi-vz-bar-bell-chart> is now defined
```

```ts [Vanilla JS]
import { mountBarBellChart } from "@michi-vz/core";

const chart = mountBarBellChart(el, props);
```

:::

## Props

<PropsTable chart="bar-bell-chart" />

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountBarBellChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`BarBellChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`BarBellChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
