---
title: Barres comparables
description: "Graphique en barres comparables : avant et après côte à côte sur une barre par étiquette, pour que l'écart qui s'est réduit ou creusé soit la première chose que voit le lecteur."
---
# Barres comparables

<span class="vp-badge tip">Comparaison</span>

Est-ce que ça s'est amélioré ou dégradé ? Placez avant et après côte à côte sur une barre par étiquette, et l'écart qui s'est réduit (ou creusé) est la première chose que voit le lecteur.

<ChartDemo chart="comparable-horizontal-bar-chart" />

> Le graphique ci-dessus est le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeComparable() {
  const colors = ["#c0392b", "#2c6fbb", "#1f1f1f", "#e07b39", "#2e8b57", "#8e44ad", "#16a085"];
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const base = 50 + Math.round(Math.random() * 2950);
    const compared = Math.max(1, Math.round(base * (0.6 + Math.random() * 0.8)));
    dataSet.push({
      label: `Region ${i + 1}`,
      valueBased: base,
      valueCompared: compared,
      color: colors[i % colors.length],
    });
  }
  return { title: "Merchandise exports: 2019 vs 2024, US$ bn (synthetic)", dataSet };
}
</script>

ComparableHorizontalBarChart dispose d'un `renderer="webgpu"` optionnel qui peint les deux sous-barres par ligne comme des rectangles instanciés sur le GPU tandis que les axes, étiquettes et infobulles restent sur la couche SVG. C'est conditionné par les capacités du navigateur : sur un navigateur sans WebGPU, il rétrograde automatiquement vers canvas, et `getContext().renderer` indique lequel a effectivement peint.

<WebgpuHeavyDemo element="michi-vz-comparable-horizontal-bar-chart" :make="makeComparable" caption="~120 lignes" />

## Usage

::: code-group

```tsx [React]
import { ComparableHorizontalBarChart } from "@michi-vz/react";

export default () => <ComparableHorizontalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ComparableHorizontalBarChart } from "@michi-vz/vue";
</script>

<template>
  <ComparableHorizontalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { comparableHorizontalBarChart } from "@michi-vz/svelte";
</script>

<div use:comparableHorizontalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyComparableHorizontalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-comparable-horizontal-bar-chart #c></michi-vz-comparable-horizontal-bar-chart>
applyComparableHorizontalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-comparable-horizontal-bar-chart id="c"></michi-vz-comparable-horizontal-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountComparableHorizontalBarChart } from "@michi-vz/core";

const chart = mountComparableHorizontalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `ComparableHorizontalBarChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou expérimentalement `"webgpu"`), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu.

## Notes de comportement

### Deux sous-barres par ligne

Chaque ligne dessine `valueBased` (derrière) et `valueCompared` (devant), divergeant depuis x=0. `valueBasedOpacity` / `valueComparedOpacity` définissent leur opacité de remplissage. Une sous-barre dont le remplissage résolu est `transparent` est **ignorée** (les consommateurs cachent une moitié via CSS). `minBarWidth` (5 par défaut) impose un plancher à une barre non nulle pour que les valeurs proches de zéro restent visibles.

### `patternsMapping` - remplissages hachurés / image

`patternsMapping: Record<label, imageSrc>` remplit la sous-barre **valeur de base** avec une image en mosaïque au lieu d'une couleur unie. `createHatchPattern({ color, angle?, spacing?, strokeWidth? })` (exporté depuis `@michi-vz/core` et `@michi-vz/react`) renvoie une URI de données SVG à hachures diagonales pour le cas courant. Le moteur de rendu canvas la met en mosaïque via `ctx.createPattern` et effectue un nouveau rendu une fois l'image chargée.

### Axe des valeurs (x)

`xAxisPredefinedDomain: [min, max]` fixe la plage de l'axe des valeurs (alias de `xAxisDomain`). `showZeroLineForXAxis` dessine une ligne pleine à x=0 (graphiques divergents) ; `showGrid` bascule les lignes de grille verticales (désactivées par défaut). `xAxisFormat` formate les étiquettes des graduations.

### Colonne d'étiquettes (y)

Les étiquettes de catégorie de l'axe des y vivent dans une colonne gauche de `tickHtmlWidth` px de large (100 par défaut, avec points de suspension). `padding.left` décale la **zone de tracé** (barres + axe des valeurs) vers la droite SANS déplacer les étiquettes - ouvrant de la place pour une colonne d'étiquettes large. `horizontalTickPosition: { x, y }` déplace légèrement les étiquettes pour les aligner avec une légende externe. `hideTickLabels` les masque entièrement (quand les noms de catégorie vivent plutôt dans une légende).

### Infobulle

`tooltipFormatter(datum, dataSet, type)` reçoit la ligne survolée, toutes les lignes, et le `type` de **sous-barre** survolée (`"based" | "compared"`). Elle renvoie une chaîne HTML ; le wrapper React accepte en plus un nœud React (converti en HTML statique). L'infobulle intégrée est consciente des bords (elle bascule près des bords droit/haut).

### Chargement / absence de données + interaction

`isLoading` et `isNodata` pilotent la superposition (React : `isLoadingComponent` / `isNodataComponent`). Survoler met en évidence une ligne (les autres s'estompent) et `mouseleave` la réinitialise ; les barres sont arrondies (rayon 5) avec une bordure de 1px.

> **Autorités de couleur côté consommateur :** le contexte porte `legendData` (`{ label, color, dataLabelSafe }`) pour qu'un système de couleur par injection CSS puisse indexer des règles par étiquette ; `onChartDataProcessed` n'est émis que lorsque le contexte **change** (réémettre un contexte inchangé à chaque rendu peut boucler un consommateur qui déclenche une action à chaque appel).
