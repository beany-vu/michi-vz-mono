---
title: API Jauge (anneaux)
---

# API Jauge (anneaux)

Des anneaux concentriques, de l'extérieur vers l'intérieur, chacun balayant `value / max` d'un cercle complet sur une piste de fond - voir la **[démo Jauge](/fr/charts/gauge)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/gauge-chart";
// <michi-vz-gauge-chart> is now defined
```

```ts [Vanilla JS]
import { mountGaugeChart } from "@michi-vz/core";

const chart = mountGaugeChart(el, props);
```

:::

## Props

<PropsTable chart="gauge-chart" />

## Events

Le web component émet ces `CustomEvent`s à propagation (le moteur expose les mêmes via les rappels `on*` du tableau ci-dessus) :

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountGaugeChart(el, props).getContext()` renvoie un **`GaugeChartContext`** indépendant du moteur de rendu : l'échelle `max`, les `rings` (label / value / fraction / index, de l'extérieur vers l'intérieur), des statistiques (nombre d'anneaux, anneau le plus grand), un résumé déterministe en langage naturel et un tableau a11y. Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées [`GaugeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
