---
title: API Graphique en éventail
---

# API Graphique en éventail

Tracez la prévision et son incertitude dans un seul graphique : historique, une médiane en pointillés, et des bandes de confiance qui s'élargissent avec l'horizon - voir la **[démo du Graphique en éventail](/fr/charts/fan)**.

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

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le surlignage au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountFanChart(el, props).getContext()` renvoie un **`FanChartContext`** agnostique du renderer (comptes historique/prévision par série, niveaux de bande, incertitude finale, plus un résumé déterministe en langage naturel + un tableau d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées comme [`FanChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
