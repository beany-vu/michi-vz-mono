---
title: API Camembert / Anneau
---

# API Camembert / Anneau

Des parts dimensionnées selon leur part du tout, avec un mode anneau accessible via une seule propriété (`innerRadiusRatio`) - voir la **[démo Camembert / Anneau](/fr/charts/pie)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/pie-chart";
// <michi-vz-pie-chart> is now defined
```

```ts [Vanilla JS]
import { mountPieChart } from "@michi-vz/core";

const chart = mountPieChart(el, props);
```

:::

## Propriétés

<PropsTable chart="pie-chart" />

## Événements

Le composant web émet ces `CustomEvent`s à bouillonnement (bubbling) (le moteur expose les mêmes via les callbacks `on*` du tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | la surbrillance au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | un mapping de couleurs est généré |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountPieChart(el, props).getContext()` retourne un **`PieChartContext`** indépendant du moteur de rendu : le `mode` (`"pie"` ou `"donut"`), `innerRadiusRatio`, les `slices` (étiquette / valeur / part / angle de début et de fin), des statistiques de synthèse (nombre de parts, total, plus grande part), un résumé déterministe en langage naturel, et une table d'accessibilité. Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les propriétés sont typées comme [`PieChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
