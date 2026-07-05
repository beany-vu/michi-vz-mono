---
title: API Graphique d'étendue
---

# API Graphique d'étendue

Représentez l'étendue plutôt qu'une seule ligne - l'API pour les bandes min-max et les cônes de prévision. Consultez la **[démo Graphique d'étendue](/fr/charts/range)** pour des exemples d'utilisation.

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

:::

## Propriétés

<PropsTable chart="range-chart" />

## Événements

Le composant web émet ces `CustomEvent`s à bouillonnement (bubbling) (le moteur expose les mêmes via les callbacks `on*` du tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | la surbrillance au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | un mapping de couleurs est généré |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountRangeChart(el, props).getContext()` retourne un **`RangeChartContext`** indépendant du moteur de rendu (statistiques structurées + un résumé déterministe en langage naturel + une table d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les propriétés sont typées comme [`RangeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
