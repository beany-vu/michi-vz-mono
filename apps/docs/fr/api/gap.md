---
title: API Graphique d'écart
---

# API Graphique d'écart

Montrez la distance entre deux nombres et laissez la barre porter tout l'impact - voir la **[démo du Graphique d'écart](/fr/charts/gap)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/gap-chart";
// <michi-vz-gap-chart> is now defined
```

```ts [Vanilla JS]
import { mountGapChart } from "@michi-vz/core";

const chart = mountGapChart(el, props);
```

:::

## Props

<PropsTable chart="gap-chart" />

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le surlignage au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountGapChart(el, props).getContext()` renvoie un **`GapChartContext`** agnostique du renderer (statistiques structurées + un résumé déterministe en langage naturel + un tableau d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées comme [`GapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
