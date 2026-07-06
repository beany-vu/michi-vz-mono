---
title: API Carte choroplèthe
---

# API Carte choroplèthe

Une carte choroplèthe monde/région : votre propre GeoJSON, coloré par une échelle de seuils ou une carte de catégories explicite - voir la **[démo Carte choroplèthe](/fr/charts/choropleth-map)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/choropleth-map-chart";
// <michi-vz-choropleth-map-chart> is now defined
```

```ts [Vanilla JS]
import { mountChoroplethMapChart } from "@michi-vz/core";

const chart = mountChoroplethMapChart(el, props);
```

:::

## Props

<PropsTable chart="choropleth-map-chart" />

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le surlignage au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sont détectés (ids de dataSet non appariés, features sans id, géométrie invalide) |

## getContext()

`mountChoroplethMapChart(el, props).getContext()` renvoie un **`ChoroplethMapChartContext`** agnostique du renderer : `stats.featureCount` / `matchedCount` / `unmatchedCount` / `valueDomain` / `min` / `max`, un tableau `regions[]` (une ligne par feature : `id`, `label`, `value?`, `color`, `matched`), le nom de `projection` résolu, un `summary` déterministe en langage naturel, et un `a11yTable` listant chaque région + valeur + indicateur d'appariement. Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées comme [`ChoroplethMapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
