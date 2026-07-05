---
title: API Barre-haltère
---

# API Barre-haltère

Enchaînez les segments sur chaque ligne pour voir exactement où atterrit la part de chaque étape dans le total - props, événements et moteur ci-dessous ; voyez-le en mouvement dans la **[démo de la Barre-haltère](/fr/charts/bar-bell)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/bar-bell-chart";
// <michi-vz-bar-bell-chart> is now defined
```

```ts [Vanilla JS]
import { mountBarBellChart } from "@michi-vz/core";

const chart = mountBarBellChart(el, props);
```

:::

## Props

<PropsTable chart="bar-bell-chart" />

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le surlignage au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountBarBellChart(el, props).getContext()` renvoie un **`BarBellChartContext`** agnostique du renderer (statistiques structurées + un résumé déterministe en langage naturel + un tableau d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées comme [`BarBellChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
