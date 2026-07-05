---
title: Cirkel / Donut API
---

# Cirkel / Donut API

Segmenten geschaald naar hun aandeel in het geheel, met een donutmodus op één eigenschap afstand (`innerRadiusRatio`) - zie de **[Cirkel / Donut-demo](/nl/charts/pie)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/pie-chart";
// <michi-vz-pie-chart> is now defined
```

```ts [Vanilla JS]
import { mountPieChart } from "@michi-vz/core";

const chart = mountPieChart(el, props);
```

:::

## Eigenschappen

<PropsTable chart="pie-chart" />

## Gebeurtenissen

Het webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Wordt geactiveerd wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de hover-markering verandert |
| `michi-vz:colormapping` | `Record<string, string>` | een kleurmapping wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | data (opnieuw) wordt verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountPieChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`PieChartContext`**: de `mode` (`"pie"` of `"donut"`), `innerRadiusRatio`, de `slices` (label / waarde / aandeel / begin- en eindhoek), samenvattende statistieken (aantal segmenten, totaal, grootste segment), een deterministische samenvatting in gewone taal, en een a11y-tabel. Zie [LLM-context](/nl/guide/llm-context).

## Bron

Eigenschappen zijn getypeerd als [`PieChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
