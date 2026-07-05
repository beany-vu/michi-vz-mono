---
title: Verschildiagram API
---

# Verschildiagram API

Toon de afstand tussen twee getallen en laat de staaf de boodschap overbrengen - zie de **[Verschildiagram-demo](/nl/charts/gap)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/gap-chart";
// <michi-vz-gap-chart> is now defined
```

```ts [Vanilla JS]
import { mountGapChart } from "@michi-vz/core";

const chart = mountGapChart(el, props);
```

:::

## Props

<PropsTable chart="gap-chart" />

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountGapChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`GapChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`GapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
