---
title: API Graphique en aires
---

# API Graphique en aires

Découvrez quelle part d'un total croissant en est vraiment le moteur - props et événements ci-dessous, ou la **[démo du Graphique en aires](/fr/charts/area)** pour le voir en action.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/area-chart";
// <michi-vz-area-chart> is now defined
```

```ts [Vanilla JS]
import { mountAreaChart } from "@michi-vz/core";

const chart = mountAreaChart(el, props);
```

:::

## Props

<PropsTable chart="area-chart" />

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le surlignage au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountAreaChart(el, props).getContext()` renvoie un **`AreaChartContext`** agnostique du renderer (statistiques structurées + un résumé déterministe en langage naturel + un tableau d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées comme [`AreaChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
