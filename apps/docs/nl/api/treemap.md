---
title: Treemap API
---

# Treemap API

Hiërarchische tegels geschaald naar waarde, elk optioneel opgesplitst in twee benoemde delen (bijv. gerealiseerd vs. onbenut), met een mobielvriendelijke stapel-fallback - zie de **[Treemap-demo](/nl/charts/treemap)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/treemap-chart";
// <michi-vz-treemap-chart> is now defined
```

```ts [Vanilla JS]
import { mountTreemapChart } from "@michi-vz/core";

const chart = mountTreemapChart(el, props);
```

:::

## Eigenschappen

<PropsTable chart="treemap-chart" />

## Gebeurtenissen

Het webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Wordt geactiveerd wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de hover-markering verandert |
| `michi-vz:colormapping` | `Record<string, string>` | een kleurmapping wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | data (opnieuw) wordt verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountTreemapChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`TreemapChartContext`**: de platte `leaves` (waarde / gedeeltelijk / restant / percentage / pad), de opgeloste `layout`, de `splitLabels`, de `depth` (nestingsdiepte), samenvattende statistieken (totaalgeneraal, totalen per deel, grootste blad, grootste restant), een deterministische samenvatting in gewone taal, en een a11y-tabel. Zie [LLM-context](/nl/guide/llm-context).

## Bron

Eigenschappen zijn getypeerd als [`TreemapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
