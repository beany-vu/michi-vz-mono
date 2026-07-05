---
title: API Graphique radar
---

# API Graphique radar

Superposez quelques candidats sur un même ensemble de critères et repérez d'un coup d'œil qui l'emporte où. Voir la **[démo Graphique radar](/fr/charts/radar)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/radar-chart";
// <michi-vz-radar-chart> is now defined
```

```ts [Vanilla JS]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
```

:::

## Propriétés

<PropsTable chart="radar-chart" />

## Événements

Le composant web émet ces `CustomEvent`s à bouillonnement (bubbling) (le moteur expose les mêmes via les callbacks `on*` du tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | la surbrillance au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | un mapping de couleurs est généré |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountRadarChart(el, props).getContext()` retourne un **`RadarChartContext`** indépendant du moteur de rendu (statistiques structurées + un résumé déterministe en langage naturel + une table d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les propriétés sont typées comme [`RadarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
