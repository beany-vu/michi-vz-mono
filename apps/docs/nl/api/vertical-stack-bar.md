---
title: Verticale gestapelde staven API
---

# Verticale gestapelde staven API

Laat zien waaruit elke categorie is opgebouwd, segment voor segment, waarbij ontbrekende delen worden gemarkeerd in plaats van weggelaten - zie de **[Verticale gestapelde staven-demo](/nl/charts/vertical-stack-bar)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/vertical-stack-bar-chart";
// <michi-vz-vertical-stack-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountVerticalStackBarChart } from "@michi-vz/core";

const chart = mountVerticalStackBarChart(el, props);
```

:::

## Eigenschappen

<PropsTable chart="vertical-stack-bar-chart" />

## Gebeurtenissen

Het webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Wordt geactiveerd wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de hover-markering verandert |
| `michi-vz:colormapping` | `Record<string, string>` | een kleurmapping wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | data (opnieuw) wordt verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountVerticalStackBarChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`VerticalStackBarChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Eigenschappen zijn getypeerd als [`VerticalStackBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
