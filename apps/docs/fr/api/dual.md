---
title: API Barres doubles (Tornado)
---

# API Barres doubles (Tornado)

Des barres divergentes depuis une ligne centrale, quand il faut montrer quel côté l'emporte et de combien - voir la **[démo des Barres doubles (Tornado)](/fr/charts/dual)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/dual-horizontal-bar-chart";
// <michi-vz-dual-horizontal-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountDualHorizontalBarChart } from "@michi-vz/core";

const chart = mountDualHorizontalBarChart(el, props);
```

:::

## Props

<PropsTable chart="dual-horizontal-bar-chart" />

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le surlignage au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountDualHorizontalBarChart(el, props).getContext()` renvoie un **`DualBarChartContext`** agnostique du renderer (statistiques structurées + un résumé déterministe en langage naturel + un tableau d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées comme [`DualBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
