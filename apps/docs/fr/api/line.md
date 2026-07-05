---
title: API Graphique en courbes
---

# API Graphique en courbes

Tout ce qu'il faut pour intégrer un graphique en courbes dans votre code ; pour la présentation et les démos, consultez la **[démo Graphique en courbes](/fr/charts/line)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/line-chart";
// <michi-vz-line-chart> is now defined
```

```ts [Vanilla JS]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, props);
```

:::

## Propriétés

<PropsTable chart="line-chart" />

## Affichage de la grille et des axes

Quatre propriétés contrôlent la densité des graduations de l'axe des ordonnées et l'affichage des lignes de grille :

| Propriété | Valeur par défaut | Remarques |
| --- | --- | --- |
| `yTicks` | `10` | Nombre approximatif de graduations sur l'axe des ordonnées. La valeur par défaut historique était 10 ; réduisez-la (par exemple `5`) pour un axe moins dense. |
| `showGridLines` | `true` | Lignes de grille horizontales en pointillés à chaque graduation de l'axe des ordonnées. |
| `showVerticalGridLines` | `false` | Lignes de grille verticales en pointillés à chaque graduation de l'axe des abscisses. Le graphique historique n'en affichait aucune ; à activer uniquement lorsque ces repères supplémentaires améliorent la lisibilité. |
| `highlightZeroLine` | `true` | Trace la ligne y=0 sous forme de trait plein (coloré via `--michi-vz-zero-line`, avec repli sur la couleur de la grille) plutôt qu'une graduation en pointillés classique. Utile lorsqu'un jeu de données couvre des valeurs positives et négatives. |

## État de chargement et d'absence de données

Le moteur gère un attribut `data-mv-state` sur l'élément hôte, avec trois valeurs possibles - `"loading"`, `"nodata"` et `"ready"` - et affiche des overlays intégrés pour les deux premières, sauf désactivation explicite.

| Propriété | Type | Valeur par défaut | Remarques |
| --- | --- | --- | --- |
| `isLoading` | `boolean` | `false` | Affiche l'overlay `.mv-loading` et ignore entièrement la vérification d'absence de données. |
| `isNodata` | `boolean \| (dataSet) => boolean` | - | Remplace le prédicat par défaut (`dataSet` vide ou chaque série ayant zéro point). Passez `false` pour forcer le rendu du graphique même quand les données semblent vides. |
| `noDataLabel` | `string` | - | Texte affiché dans l'overlay `.mv-nodata` par défaut. Ignoré lorsque `suppressDefaultOverlay` vaut `true`. |
| `suppressDefaultOverlay` | `boolean` | `false` | Empêche le moteur d'injecter son propre nœud de chargement / d'absence de données. À utiliser lorsqu'un wrapper de framework (par exemple le `LineChart` de `@michi-vz/react`) affiche à la place `isLoadingComponent` / `isNodataComponent` sous forme d'overlay React. L'hôte n'est jamais démonté - l'overlay est simplement superposé. |

::: tip Comportement du wrapper React
Le `LineChart` de `@michi-vz/react` définit automatiquement `suppressDefaultOverlay` et affiche `isLoadingComponent` / `isNodataComponent` sous forme de nœud React positionné au-dessus de l'hôte du graphique. Le DOM du graphique est toujours monté, donc `isNodataComponent` se déclenche même sur des données vides, sans prédicat personnalisé.
:::

## Police de caractères

`fontFamily` définit la propriété CSS personnalisée `--michi-vz-font-family` sur l'élément hôte, lue à la fois par le moteur de rendu de texte SVG et par la sonde `getComputedStyle` du canvas. La police doit déjà être chargée par la page - aucun embarquement de police n'est effectué.

## ChartContext / legendData

`onChartDataProcessed` reçoit un `LineChartContext` qui étend `BaseChartContext`. La base porte désormais un champ `legendData` :

```ts
interface LegendItem {
  label: string;         // series label as it appears in dataSet
  color: string;         // resolved colour at the time of processing
  order: number;         // appearance order (legend slot index)
  disabled?: boolean;    // true when the label is currently hidden
  dataLabelSafe?: string; // sanitizeForClassName(label) - the CSS hook the canvas colour probe matches
}

interface BaseChartContext {
  // ... existing fields ...
  legendData?: LegendItem[]; // populated by LineChart; treat absence as []
}
```

`legendData` est la charge utile canonique pour les autorités de couleur côté consommateur. Un wrapper de framework qui pilote son propre CSS de couleur (par exemple `useChartUtils` de thd MonitorV2) lit `legendData[].{label, dataLabelSafe, color, disabled}` à chaque appel de `onChartDataProcessed` et émet des règles `stroke`/`fill` par étiquette ciblant l'attribut `data-label-safe`. Cela évite d'avoir à recouper `colorsMapping` avec l'ordre des séries.

## Événements

Le composant web émet ces `CustomEvent`s à bouillonnement (bubbling) (le moteur expose les mêmes via les callbacks `on*` du tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | la surbrillance au survol change |
| `michi-vz:colormapping` | `Record<string, string>` | un mapping de couleurs est généré |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données d'entrée sont détectés |

## getContext()

`mountLineChart(el, props).getContext()` retourne un **`LineChartContext`** indépendant du moteur de rendu (statistiques structurées + un résumé déterministe en langage naturel + une table d'accessibilité). Voir [Contexte LLM](/fr/guide/llm-context).

## Source

Les propriétés sont typées comme [`LineChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
