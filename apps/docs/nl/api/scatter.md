---
title: Spreidingsdiagram API
---

# Spreidingsdiagram API

Grijp hiernaar wanneer de vraag is "zijn deze twee getallen aan elkaar gerelateerd?" - de eigenschappen en de engine hieronder; het antwoord staat in de **[Spreidingsdiagram-demo](/nl/charts/scatter)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/scatter-chart";
// <michi-vz-scatter-chart> is now defined
```

```ts [Vanilla JS]
import { mountScatterChart } from "@michi-vz/core";

const chart = mountScatterChart(el, props);
```

:::

## Eigenschappen

<PropsTable chart="scatter-chart" />

## Gebeurtenissen

Het webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Wordt geactiveerd wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de hover-markering verandert |
| `michi-vz:colormapping` | `Record<string, string>` | een kleurmapping wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | data (opnieuw) wordt verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountScatterChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`ScatterChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Eigenschappen zijn getypeerd als [`ScatterChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
