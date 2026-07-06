---
title: Radiale boom API
---

# Radiale boom API

Een radiaal cluster()/dendrogram: groepen waaieren uit vanaf een middelpunt, bladeren landen op DEZELFDE straal als elk ander blad - zie de **[Radiale boom demo](/nl/charts/radial-tree)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/radial-tree-chart";
// <michi-vz-radial-tree-chart> is nu gedefinieerd
```

```ts [Vanilla JS]
import { mountRadialTreeChart } from "@michi-vz/core";

const chart = mountRadialTreeChart(el, props);
```

:::

## Props

<PropsTable chart="radial-tree-chart" />

## Events

Het web component zendt deze bubbelende `CustomEvent`s uit (de engine biedt hetzelfde via de `on*`-callbacks in de tabel hierboven):

| Event | Detail | Vuurt wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de hover-highlight verandert |
| `michi-vz:colormapping` | `Record<string, string>` | een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | data (opnieuw) wordt verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | invoerwaarschuwingen worden gedetecteerd (lege groepen, negatieve/niet-eindige waarden, dubbele labels, nesten dieper dan 2 niveaus) |

## getContext()

`mountRadialTreeChart(el, props).getContext()` geeft een renderer-agnostische **`RadialTreeChartContext`** terug: `stats.leafCount` / `groupCount` / `grandTotal` / `largest` (het grootste blad) / `maxDepth`, een `nodes[]`-array (één rij per knoop - groep OF blad - met `label`, `code`, `color`, `depth`, `isLeaf`, `value`, `path`), een deterministische `summary` in natuurlijke taal, en een `a11yTable`. Zie [LLM-context](/nl/guide/llm-context).

## Bron

Props zijn getypeerd als [`RadialTreeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
