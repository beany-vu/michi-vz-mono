---
title: Radardiagram API
---

# Radardiagram API

Zet een paar kandidaten tegen elkaar af op één gedeelde set criteria en zie in één oogopslag wie waar wint. Zie de **[Radardiagram-demo](/nl/charts/radar)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/radar-chart";
// <michi-vz-radar-chart> is now defined
```

```ts [Vanilla JS]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
```

:::

## Eigenschappen

<PropsTable chart="radar-chart" />

## Gebeurtenissen

Het webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Wordt geactiveerd wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de hover-markering verandert |
| `michi-vz:colormapping` | `Record<string, string>` | een kleurmapping wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | data (opnieuw) wordt verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountRadarChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`RadarChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Eigenschappen zijn getypeerd als [`RadarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
