---
title: API Graphique en ruban
---

# API Graphique en ruban

Observez une composition se réorganiser dans le temps, une catégorie connectée à la fois. Voir la **[démo Graphique en ruban](/fr/charts/ribbon)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/ribbon-chart";
// <michi-vz-ribbon-chart> is now defined
```

```ts [Vanilla JS]
import { mountRibbonChart } from "@michi-vz/core";

const chart = mountRibbonChart(el, props);
```

:::

## Propriétés

<PropsTable chart="ribbon-chart" />

## Événements

Le composant web émet ces `CustomEvent`s à bouillonnement (bubbling) (le moteur expose les mêmes via les callbacks `on*` du tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | la surbrillance au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | un mapping de couleurs est généré |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountRibbonChart(el, props).getContext()` retourne un **`RibbonChartContext`** indépendant du moteur de rendu (statistiques structurées + un résumé déterministe en langage naturel + une table d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les propriétés sont typées comme [`RibbonChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
