---
title: Dubbele staven (Tornado) API
---

# Dubbele staven (Tornado) API

Uiteenlopende staven vanaf een middellijn, voor wanneer je moet laten zien welke kant wint en met hoeveel - zie de **[Dubbele-staven-demo (Tornado)](/nl/charts/dual)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/dual-horizontal-bar-chart";
// <michi-vz-dual-horizontal-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountDualHorizontalBarChart } from "@michi-vz/core";

const chart = mountDualHorizontalBarChart(el, props);
```

:::

## Props

<PropsTable chart="dual-horizontal-bar-chart" />

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountDualHorizontalBarChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`DualBarChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`DualBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
