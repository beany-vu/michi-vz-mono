---
title: Camembert / Anneau
description: "Camembert et anneau : parts dimensionnées selon la valeur, étiquetées avec des pourcentages, triées pour que la plus grosse part se lise en premier ; réglez innerRadiusRatio au-dessus de 0 pour un anneau."
---
# Camembert / Anneau

<span class="vp-badge tip">Composition</span>

« Quelle part chaque élément occupe-t-il dans le tout ? » La plus ancienne question de la visualisation de données, et un camembert y répond encore le mieux lorsqu'il n'y a qu'une poignée de parts. Chaque part est dimensionnée selon sa valeur et étiquetée avec son pourcentage ; les parts sont triées par valeur pour que la plus grosse se lise en premier. Vous préférez un anneau ? C'est le **même graphique** - réglez `innerRadiusRatio` au-dessus de 0 pour creuser le trou (le contexte indique alors `mode: "donut"`).

<ChartDemo chart="pie-chart" :legend="false" />

La variante en anneau n'est qu'une prop plus loin - voici les mêmes parts avec `innerRadiusRatio: 0.6`, un léger `padAngle`, et des coins arrondis :

<ChartDemo chart="pie-chart" :index="1" :legend="false" />

> Gardez un nombre de parts faible (≈ 6 ou moins). Pour de nombreuses catégories, une [barre](/fr/charts/comparable) ou un [treemap](/fr/charts/treemap) se lit plus précisément qu'un camembert.

## Quand le choisir

- **Parts pour présentation au conseil.** Une poignée de parts, chacune étiquetée avec son pourcentage : toujours le moyen le plus rapide de montrer « qui prend quelle part du tout » sur une diapositive.
- **Anneaux de tableau de bord.** Réglez `innerRadiusRatio` et le centre creusé devient un emplacement de choix pour le chiffre phare que le camembert vient appuyer.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makePie() {
  const palette = ["#005aba", "#f0a500", "#2aa39a", "#c0392b", "#7952b3", "#e67e22", "#16a085", "#8e44ad", "#2c3e50", "#d35400"];
  const dataSet = [];
  for (let i = 0; i < 40; i++) {
    dataSet.push({
      label: `Segment ${i + 1}`,
      value: Math.round(20 + Math.random() * 480),
      color: palette[i % palette.length],
    });
  }
  // Pas de légende ici : 40 pastilles de légende débordent de la carte de démo ; survolez plutôt une part.
  return { dataSet, showLabels: true, showLegend: false };
}
</script>

PieChart possède un `renderer="webgpu"` optionnel qui dessine les parts comme des arcs rendus par le GPU tandis que les libellés, la légende et les infobulles restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

<WebgpuHeavyDemo element="michi-vz-pie-chart" :make="makePie" caption="40 slices" />

## Utilisation

::: code-group

```tsx [React]
import { PieChart } from "@michi-vz/react";

export default () => <PieChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { PieChart } from "@michi-vz/vue";
</script>

<template>
  <PieChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { pieChart } from "@michi-vz/svelte";
</script>

<div use:pieChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyPieChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-pie-chart #c></michi-vz-pie-chart>
applyPieChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-pie-chart id="c"></michi-vz-pie-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, innerRadiusRatio, …
</script>
```

```ts [Vanilla JS]
import { mountPieChart } from "@michi-vz/core";

const chart = mountPieChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Forme des données

Chaque élément de `dataSet` est une part : un `label`, une `value`, et une `color` optionnelle.

```ts
const props = {
  innerRadiusRatio: 0, // 0 = pie; e.g. 0.6 = donut
  showLabels: true,    // % labels inside large-enough slices
  showLegend: true,
  dataSet: [
    { label: "Industry", value: 281, color: "#005aba" },
    { label: "Agri-food", value: 381, color: "#f0a500" },
    { label: "Materials", value: 132, color: "#2aa39a" },
  ],
};
```

## Camembert ou anneau

Un seul moteur dessine les deux. `innerRadiusRatio` est le trou exprimé comme fraction du rayon extérieur : `0` donne un camembert plein, `0.6` un anneau. `padAngle` (en radians) ajoute un espace entre les parts et `cornerRadius` arrondit les coins des arcs. Les parts, l'infobulle, `getContext()` et la parité SVG/canvas sont identiques dans les deux cas.

## API

Les props sont typées comme `PieChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu. Référence complète : [API Camembert / Anneau](/fr/api/pie).
