---
title: Bellendiagram API
---

# Bellendiagram API

Cirkels die door zwaartekracht worden geclusterd en op waarde zijn geschaald, elk optioneel opgesplitst in een gerealiseerde kern en een onbenutte ring - zie de **[Bellendiagram-demo](/nl/charts/bubble)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/bubble-chart";
// <michi-vz-bubble-chart> is now defined
```

```ts [Vanilla JS]
import { mountBubbleChart } from "@michi-vz/core";

const chart = mountBubbleChart(el, props);
```

:::

## Props

<PropsTable chart="bubble-chart" />

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de highlight bij hover verandert |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountBubbleChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`BubbleChartContext`**: de platte `bubbles` (value / partial / remainder / percent), `splitLabels`, samenvattende statistieken (aantal bubbels, totaal, totalen per onderdeel, grootste bubbel, grootste restwaarde), een deterministische samenvatting in gewone taal, en een a11y-tabel. Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`BubbleChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
