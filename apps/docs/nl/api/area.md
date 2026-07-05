---
title: Vlakdiagram API
---

# Vlakdiagram API

Ontdek welk deel van een groeiend totaal daar echt de motor achter is - props en events hieronder, of de **[Vlakdiagram-demo](/nl/charts/area)** om het in actie te zien.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/area-chart";
// <michi-vz-area-chart> is now defined
```

```ts [Vanilla JS]
import { mountAreaChart } from "@michi-vz/core";

const chart = mountAreaChart(el, props);
```

:::

## Props

<PropsTable chart="area-chart" />

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountAreaChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`AreaChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`AreaChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
