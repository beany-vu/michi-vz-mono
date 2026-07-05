---
title: API Graphique à bulles
---

# API Graphique à bulles

Cercles dimensionnés par valeur, attirés en grappe par gravité, chacun pouvant être divisé en un noyau réalisé et un anneau inexploité - voir la **[démo du Graphique à bulles](/fr/charts/bubble)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/bubble-chart";
// <michi-vz-bubble-chart> is now defined
```

```ts [Vanilla JS]
import { mountBubbleChart } from "@michi-vz/core";

const chart = mountBubbleChart(el, props);
```

:::

## Props

<PropsTable chart="bubble-chart" />

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le surlignage au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountBubbleChart(el, props).getContext()` renvoie un **`BubbleChartContext`** agnostique du renderer : le tableau plat `bubbles` (value / partial / remainder / percent), `splitLabels`, des statistiques de synthèse (nombre de bulles, total, totaux par partie, plus grande bulle, plus grand reliquat), un résumé déterministe en langage naturel, et un tableau d'accessibilité. Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées comme [`BubbleChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
