---
title: API Carte à symboles
---

# API Carte à symboles

Une carte à bulles/symboles dont les chevauchements sont résolus par une simulation de force : vous fournissez lng/lat par élément, une simulation en une passe écarte les cercles qui se chevauchent - voir la **[démo Carte à symboles](/fr/charts/symbol-map)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/symbol-map-chart";
// <michi-vz-symbol-map-chart> is now defined
```

```ts [Vanilla JS]
import { mountSymbolMapChart } from "@michi-vz/core";

const chart = mountSymbolMapChart(el, props);
```

:::

## Props

<PropsTable chart="symbol-map-chart" />

## Événements

Le composant web émet ces `CustomEvent`s bouillonnants (le moteur expose les mêmes via les callbacks `on*` du tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleur est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sont détectés (lng/lat manquant ou invalide, valeurs négatives, ids en double) |

## getContext()

`mountSymbolMapChart(el, props).getContext()` renvoie un **`SymbolMapChartContext`** agnostique du moteur de rendu : `stats.locatedCount` / `visibleCount` / `hiddenCount` (exclus par `radiusVisibleMin`) / `invalidCount` (rejetés pour coordonnées invalides) / `valueDomain` / `largest` / `smallest`, un tableau `symbols[]` (une ligne par élément visible : `id`, `label`, `value`, `valueSecond`, `radius`, `radiusSecond`, `color`), le nom de `projection` résolu, un résumé déterministe en langage naturel, et un `a11yTable`. Voir [contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées comme [`SymbolMapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
