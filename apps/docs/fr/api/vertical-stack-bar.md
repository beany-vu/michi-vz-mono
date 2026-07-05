---
title: API Barres empilées verticales
---

# API Barres empilées verticales

Montrez de quoi chaque catégorie est composée, segment par segment, avec les parties manquantes signalées plutôt qu'omises - voir la **[démo Barres empilées verticales](/fr/charts/vertical-stack-bar)**.

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

## Propriétés

<PropsTable chart="vertical-stack-bar-chart" />

## Événements

Le composant web émet ces `CustomEvent`s à bouillonnement (bubbling) (le moteur expose les mêmes via les callbacks `on*` du tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | la surbrillance au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | un mapping de couleurs est généré |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountVerticalStackBarChart(el, props).getContext()` retourne un **`VerticalStackBarChartContext`** indépendant du moteur de rendu (statistiques structurées + un résumé déterministe en langage naturel + une table d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les propriétés sont typées comme [`VerticalStackBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
