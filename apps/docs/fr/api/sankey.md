---
title: API Sankey
---

# API Sankey

Des flux entre nœuds disposés en colonnes, avec une épaisseur de bande proportionnelle à la valeur du flux (construit sur d3-sankey) - voir la **[démo Sankey](/fr/charts/sankey)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/sankey-chart";
// <michi-vz-sankey-chart> is now defined
```

```ts [Vanilla JS]
import { mountSankeyChart } from "@michi-vz/core";

const chart = mountSankeyChart(el, props);
```

:::

## Propriétés

<PropsTable chart="sankey-chart" />

::: tip Les données sont deux tableaux
Contrairement aux autres graphiques, un Sankey prend `nodes` (`{ id, label?, color? }[]`) et `links` (`{ source, target, value }[]`) au lieu d'un unique `dataSet`.
:::

## Événements

Le composant web émet ces `CustomEvent`s à bouillonnement (bubbling) (le moteur expose les mêmes via les callbacks `on*` du tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | la surbrillance au survol change (id de nœud, ou la source + la cible d'un lien) |
| `michi-vz:colormapping` | `Record<string, string>` | un mapping de couleurs est généré |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés (par exemple un lien vers un nœud inconnu) |

## getContext()

`mountSankeyChart(el, props).getContext()` retourne un **`SankeyChartContext`** indépendant du moteur de rendu : les `nodes` (id / étiquette / couleur / valeur / profondeur de colonne), les `links` (source / cible / valeur / couleur), des statistiques de synthèse (nombre de nœuds et de liens, nombre de colonnes, flux total, plus grand lien, nœud le plus actif), un résumé déterministe en langage naturel, et une table d'accessibilité listant les flux. Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les propriétés sont typées comme [`SankeyChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
