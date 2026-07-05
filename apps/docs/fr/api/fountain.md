---
title: API Fontaine (Jet d'Eau)
---

# API Fontaine (Jet d'Eau)

Un graphique, deux modes : hauteur de l'apex = valeur, panache en éclosion = incertitude. X catégoriel = instantané/comparaison ; x temporel ou numérique = tendance - voir la **[démo de la Fontaine](/fr/charts/fountain)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/fountain-chart";
// <michi-vz-fountain-chart> is now defined
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
```

:::

## Props

<PropsTable chart="fountain-chart" />

::: tip Deux modes, une seule forme de données
Définissez `xAxisDataType: "band"` (ou omettez-le) pour le **mode Instantané** - chaque élément obtient sa propre bande en x, côte à côte. Fournissez un `xAxisDataType` temporel ou numérique ainsi qu'une `date` sur chaque élément pour le **mode Tendance** - les jets sont placés le long de l'axe temporel et une ligne de tendance relie leurs sommets. Un élément avec `predicted: true` s'affiche en pointillés avec une couronne plus mousseuse.
:::

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le surlignage au survol change (étiquette du jet) |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés (par ex. une valeur ou une étendue non finie) |

## getContext()

`mountFountainChart(el, props).getContext()` renvoie un **`FountainChartContext`** agnostique du renderer :

- **`mode`** - `"snapshot"` pour un x catégoriel/en bandes, `"trend"` pour un x temporel/numérique.
- **`jets`** - une entrée par jet visible : `{ label, code?, color, value, spread, upperBound, spreadRatio, predicted, xPosition }`. `upperBound` = `value + spread` ; `spreadRatio` = `spread / value` (incertitude relative) ; `xPosition` est la date/le nombre brut en mode tendance, ou `null` en mode instantané.
- **`stats`** - objet de synthèse :
  - `jetCount` - nombre de jets visibles.
  - `tallest` - `{ label, value }` du jet le plus haut, ou `null` s'il est vide.
  - `frothiest` - `{ label, spreadRatio }` du jet le plus incertain, ou `null` s'il est vide.
  - `trendSlope` - pente d'une régression linéaire sur les valeurs des jets par index en mode tendance ; `null` en mode instantané.
  - `valueRange` - `[min, max]` des valeurs des jets, ou `null` s'il est vide.
  - `predictedCount` - nombre de jets de prévision.

Voir [Contexte LLM](/fr/guide/llm-context) pour savoir comment utiliser le contexte dans des prompts et des rapports.

## Source

Les props sont typées comme [`FountainChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
