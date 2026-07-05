---
title: Waaierdiagram API
---

# Waaierdiagram API

Zet de prognose en de onzekerheid ervan in één grafiek: historie, een gestippelde mediaan, en betrouwbaarheidsbanden die breder worden naarmate de horizon verder weg ligt - zie de **[Waaierdiagram-demo](/nl/charts/fan)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/fan-chart";
// <michi-vz-fan-chart> is now defined
```

```ts [Vanilla JS]
import { mountFanChart } from "@michi-vz/core";

const chart = mountFanChart(el, props);
```

```ts [Insights helper]
import { forecastFan } from "@michi-vz/insights/forecast";

const item = forecastFan(history, { horizon: 4, levels: [0.5, 0.8], level: 0.95 }, "Revenue");
const chart = mountFanChart(el, { dataSet: [item], xAxisDataType: "date_annual" });
```

:::

## Props

<PropsTable chart="fan-chart" />

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountFanChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`FanChartContext`** (historie-/prognosetellingen per serie, bandniveaus, uiteindelijke onzekerheid, plus een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`FanChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
