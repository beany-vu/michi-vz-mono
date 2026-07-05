---
title: Treemap
description: "Treemap avec des tuiles dimensionnées selon le total et une division optionnelle en deux parties montrant la part réalisée par rapport à la part inexploitée ; s'imbrique sous des groupes et se replie en pile sur les écrans étroits."
---
# Treemap

<span class="vp-badge tip">Composition</span>

« Quelles parties sont les plus grosses, et quelle part de chacune est déjà réalisée ? » Un treemap répond aux deux à la fois : chaque tuile est dimensionnée selon son total, et une **division optionnelle en deux parties** remplit la part solide à l'intérieur de chaque tuile - vous lisez ainsi l'ampleur (l'aire) et la progression (la division) en un seul coup d'œil. Le cas classique est le potentiel d'exportation : l'aire de la tuile = le potentiel total, la partie solide = **réalisé**, la partie plus claire = **inexploité**. Les tuiles peuvent s'imbriquer sous des groupes, et sur un écran étroit, l'ensemble se replie en une **pile** lisible sur une seule colonne.

<ChartDemo chart="treemap-chart" />

Vous préférez une liste plate (une tuile par produit, chacune sa propre couleur - la disposition classique du potentiel d'exportation) ? Retirez l'imbrication `children` et passez les feuilles directement :

<ChartDemo chart="treemap-chart" :index="1" />

> La division est générique. Nommez les deux parties avec `splitLabels` - `["Realized", "Untapped"]`, `["Used", "Free"]`, `["Done", "Remaining"]` - rien dans le moteur ne code en dur un domaine.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeTreemap() {
  const sectors = [
    { label: "Industry", color: "#1d3557" },
    { label: "Agri-food", color: "#e9c46a" },
    { label: "Materials", color: "#2a9d8f" },
    { label: "Textiles", color: "#e63946" },
    { label: "Pharmaceuticals", color: "#457b9d" },
    { label: "Energy", color: "#f4a261" },
    { label: "Electronics", color: "#9b5de5" },
    { label: "Services", color: "#06d6a0" },
  ];
  const dataSet = sectors.map((sector, si) => {
    const children = [];
    for (let i = 0; i < 50; i++) {
      const value = 5 + Math.round(Math.random() * 120);
      const partial = Math.round(Math.random() * value);
      children.push({
        label: `${sector.label} product ${si * 50 + i + 1}`,
        value,
        partial,
      });
    }
    return { label: sector.label, color: sector.color, children };
  });
  return { splitLabels: ["Realized", "Untapped"], showLegend: true, layout: "squarify", dataSet };
}
</script>

TreemapChart possède un `renderer="webgpu"` optionnel qui dessine les tuiles comme des rectangles rendus par le GPU tandis que les libellés, les infobulles et le remplissage de la division restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

<WebgpuHeavyDemo element="michi-vz-treemap-chart" :make="makeTreemap" caption="~400 tiles" />

## Utilisation

::: code-group

```tsx [React]
import { TreemapChart } from "@michi-vz/react";

export default () => <TreemapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { TreemapChart } from "@michi-vz/vue";
</script>

<template>
  <TreemapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { treemapChart } from "@michi-vz/svelte";
</script>

<div use:treemapChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyTreemapChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-treemap-chart #c></michi-vz-treemap-chart>
applyTreemapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-treemap-chart id="c"></michi-vz-treemap-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, splitLabels, …
</script>
```

```ts [Vanilla JS]
import { mountTreemapChart } from "@michi-vz/core";

const chart = mountTreemapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Forme des données

Chaque nœud de `dataSet` est soit une feuille (`value`, `partial` optionnel), soit un parent (`children`). La valeur d'un parent est la somme de ses feuilles.

```ts
const props = {
  splitLabels: ["Realized", "Untapped"],
  showLegend: true,
  layout: "auto", // squarify on desktop, stack on narrow screens
  dataSet: [
    { label: "Agri-food", children: [
      { label: "Fruits", value: 100, partial: 34 },   // 34% realized
      { label: "Beverages", value: 50, partial: 35 }, // 70% realized
    ]},
    { label: "Industry", children: [
      { label: "Machinery", value: 120, partial: 64 },
    ]},
  ],
};
```

## Disposition adaptative

`layout` choisit l'algorithme de pavage : `"squarify"` (le treemap), `"stack"` (une partition verticale en une seule colonne - lignes pleine largeur, hauteur proportionnelle à la valeur, avec la même division dans chaque ligne), ou `"auto"` (passe en pile en dessous de `stackBreakpoint`, 480px par défaut). La division, les libellés, l'infobulle, `getContext()` et la parité SVG/canvas sont identiques dans les deux dispositions.

## API

Les props sont typées comme `TreemapChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu. Référence complète : [API Treemap](/fr/api/treemap).
