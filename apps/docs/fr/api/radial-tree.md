---
title: API Arbre radial
---

# API Arbre radial

Un cluster()/dendrogramme radial : les groupes rayonnent depuis un point central, les feuilles atterrissent sur le MÊME rayon que toutes les autres feuilles - voir la **[démo Arbre radial](/fr/charts/radial-tree)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/radial-tree-chart";
// <michi-vz-radial-tree-chart> est maintenant défini
```

```ts [Vanilla JS]
import { mountRadialTreeChart } from "@michi-vz/core";

const chart = mountRadialTreeChart(el, props);
```

:::

## Props

<PropsTable chart="radial-tree-chart" />

## Événements

Le web component émet ces `CustomEvent`s qui remontent (bubbling) (le moteur expose les mêmes via les callbacks `on*` du tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le survol change |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleur est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données en entrée sont détectés (groupes vides, valeurs négatives/non finies, labels dupliqués, imbrication au-delà de 2 niveaux) |

## getContext()

`mountRadialTreeChart(el, props).getContext()` renvoie un **`RadialTreeChartContext`** agnostique du moteur de rendu : `stats.leafCount` / `groupCount` / `grandTotal` / `min` (la plus petite feuille) / `max` (la plus grande feuille) / `maxDepth`, un tableau `nodes[]` (une ligne par nœud - groupe OU feuille - avec `label`, `code`, `color`, `depth`, `isLeaf`, `value`, `path`), un `summary` déterministe en langage naturel, et un `a11yTable`. Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les props sont typées [`RadialTreeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
