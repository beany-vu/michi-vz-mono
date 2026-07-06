---
title: API Barres comparables verticales
---

# API Barres comparables verticales

Deux valeurs par catégorie, de base vs comparée, sous forme de colonnes superposées en pleine largeur avec une flèche de variation optionnelle au-dessus de chaque paire - voir la **[démo des Barres comparables verticales](/fr/charts/comparable-vertical-bar)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/comparable-vertical-bar-chart";
// <michi-vz-comparable-vertical-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountComparableVerticalBarChart } from "@michi-vz/core";

const chart = mountComparableVerticalBarChart(el, props);
```

:::

## Props

<PropsTable chart="comparable-vertical-bar-chart" />

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le surlignage au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountComparableVerticalBarChart(el, props).getContext()` renvoie un **`ComparableVerticalBarChartContext`** agnostique du renderer (statistiques structurées + un résumé déterministe en langage naturel + un tableau d'accessibilité). Contrairement à ComparableHorizontalBarChart, ce contexte reflète `deltaIndicator` quand il est actif : `series[].deltaDirection` / `deltaColor` / `deltaLabel`, et `stats.grew` / `stats.shrank` / `stats.unchanged` / `stats.improved` / `stats.worsened`. Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées comme [`ComparableVerticalBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
