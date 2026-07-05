---
title: API Treemap
---

# API Treemap

Des tuiles hiérarchiques dimensionnées selon leur valeur, chacune pouvant être divisée en deux parties nommées (par exemple réalisé vs. non exploité), avec un repli en pile adapté au mobile - voir la **[démo Treemap](/fr/charts/treemap)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/treemap-chart";
// <michi-vz-treemap-chart> is now defined
```

```ts [Vanilla JS]
import { mountTreemapChart } from "@michi-vz/core";

const chart = mountTreemapChart(el, props);
```

:::

## Propriétés

<PropsTable chart="treemap-chart" />

## Événements

Le composant web émet ces `CustomEvent`s à bouillonnement (bubbling) (le moteur expose les mêmes via les callbacks `on*` du tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | la surbrillance au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | un mapping de couleurs est généré |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountTreemapChart(el, props).getContext()` retourne un **`TreemapChartContext`** indépendant du moteur de rendu : les `leaves` à plat (valeur / partiel / reste / pourcentage / chemin), le `layout` résolu, les `splitLabels`, la `depth` d'imbrication, des statistiques de synthèse (total général, totaux par partie, plus grande feuille, plus grand reste), un résumé déterministe en langage naturel, et une table d'accessibilité. Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les propriétés sont typées comme [`TreemapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
