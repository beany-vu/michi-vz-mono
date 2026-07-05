---
title: Lintdiagram API
---

# Lintdiagram API

Bekijk hoe een samenstelling zichzelf in de loop van de tijd herrangschikt, één verbonden categorie tegelijk. Zie de **[Lintdiagram-demo](/nl/charts/ribbon)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/ribbon-chart";
// <michi-vz-ribbon-chart> is now defined
```

```ts [Vanilla JS]
import { mountRibbonChart } from "@michi-vz/core";

const chart = mountRibbonChart(el, props);
```

:::

## Eigenschappen

<PropsTable chart="ribbon-chart" />

## Gebeurtenissen

Het webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Wordt geactiveerd wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de hover-markering verandert |
| `michi-vz:colormapping` | `Record<string, string>` | een kleurmapping wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | data (opnieuw) wordt verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountRibbonChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`RibbonChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Eigenschappen zijn getypeerd als [`RibbonChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
