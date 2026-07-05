---
title: API Barres comparables
---

# API Barres comparables

Deux valeurs par étiquette, de base vs comparée, pour lire les écarts avant/après en un coup d'œil - voir la **[démo des Barres comparables](/fr/charts/comparable)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/comparable-horizontal-bar-chart";
// <michi-vz-comparable-horizontal-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountComparableHorizontalBarChart } from "@michi-vz/core";

const chart = mountComparableHorizontalBarChart(el, props);
```

:::

## Props

<PropsTable chart="comparable-horizontal-bar-chart" />

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le surlignage au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountComparableHorizontalBarChart(el, props).getContext()` renvoie un **`ComparableBarChartContext`** agnostique du renderer (statistiques structurées + un résumé déterministe en langage naturel + un tableau d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées comme [`ComparableBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
