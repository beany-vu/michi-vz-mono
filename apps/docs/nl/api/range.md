---
title: Bereikdiagram API
---

# Bereikdiagram API

Arceer de spreiding, niet slechts één lijn - de API voor min-max-banden en prognosekegels. Zie de **[Bereikdiagram-demo](/nl/charts/range)** voor voorbeelden en gebruik.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/range-chart";
// <michi-vz-range-chart> is now defined
```

```ts [Vanilla JS]
import { mountRangeChart } from "@michi-vz/core";

const chart = mountRangeChart(el, props);
```

```ts [React]
import { RangeChart } from "@michi-vz/react/range-chart";
```

```ts [Vue]
import { RangeChart } from "@michi-vz/vue/range-chart";
```

```ts [Svelte]
import { rangeChart } from "@michi-vz/svelte/range-chart";
```

```ts [Angular]
import { bindChart, applyRangeChartProps } from "@michi-vz/angular/range-chart";
// needs CUSTOM_ELEMENTS_SCHEMA on the component that hosts <michi-vz-range-chart>
```

:::

## Eigenschappen

<PropsTable chart="range-chart" />

## Gebeurtenissen

Het webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt dezelfde functionaliteit via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Wordt geactiveerd wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de hover-markering verandert |
| `michi-vz:colormapping` | `Record<string, string>` | een kleurmapping wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | data (opnieuw) wordt verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd |

## getContext()

`mountRangeChart(el, props).getContext()` retourneert een renderer-onafhankelijke **`RangeChartContext`** (gestructureerde statistieken + een deterministische samenvatting in gewone taal + een a11y-tabel). Zie [LLM-context](/nl/guide/llm-context).

## Bron

Eigenschappen zijn getypeerd als [`RangeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
