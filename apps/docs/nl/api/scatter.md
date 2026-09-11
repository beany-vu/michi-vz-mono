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

```ts [React]
import { ScatterChart } from "@michi-vz/react/scatter-chart";
```

```ts [Vue]
import { ScatterChart } from "@michi-vz/vue/scatter-chart";
```

```ts [Svelte]
import { scatterChart } from "@michi-vz/svelte/scatter-chart";
```

```ts [Angular]
import { bindChart, applyScatterChartProps } from "@michi-vz/angular/scatter-chart";
// needs CUSTOM_ELEMENTS_SCHEMA on the component that hosts <michi-vz-scatter-chart>
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
