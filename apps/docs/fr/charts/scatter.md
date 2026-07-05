---
title: Nuage de points
description: "Nuage de points avec tendance, groupes et valeurs aberrantes en un coup d'œil ; la taille des bulles porte une troisième variable et la corrélation de Pearson revient dans getContext()."
---
# Nuage de points

<span class="vp-badge tip">Corrélation</span>

Est-ce que plus de X fait vraiment bouger Y, ou poursuivez-vous une coïncidence ? Tracez vos points et la tendance, les groupes et les valeurs aberrantes ressortent tous en un coup d'œil, avec la taille des bulles qui porte une troisième variable gratuitement. La corrélation de Pearson revient dans getContext(), pour que vous puissiez citer le chiffre au lieu de scruter le nuage.

<ChartDemo chart="scatter-chart" />

> Le graphique ci-dessus utilise le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeScatter() {
  const clusters = [
    { label: "Cluster A", color: "#e63946", cx: 25, cy: 70 },
    { label: "Cluster B", color: "#1d3557", cx: 70, cy: 60 },
    { label: "Cluster C", color: "#2a9d8f", cx: 50, cy: 30 },
    { label: "Cluster D", color: "#e9c46a", cx: 80, cy: 25 },
    { label: "Cluster E", color: "#9b5de5", cx: 35, cy: 40 },
  ];
  const g = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const dataSet = [];
  const colorsMapping = {};
  for (const c of clusters) colorsMapping[c.label] = c.color;
  for (let i = 0; i < 50000; i++) {
    const c = clusters[i % clusters.length];
    dataSet.push({
      label: c.label,
      x: Math.max(0, Math.min(100, c.cx + g() * 7)),
      y: Math.max(0, Math.min(100, c.cy + g() * 7)),
    });
  }
  return { dataSet, colorsMapping, xAxisDataType: "number", xAxisDomain: [0, 100], yAxisDomain: [0, 100], sizeRange: [2, 2] };
}
</script>

ScatterChart possède un `renderer="webgpu"` optionnel qui dessine le nuage de points comme des cercles rendus par le GPU tandis que les axes, les libellés et les infobulles restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

<WebgpuHeavyDemo element="michi-vz-scatter-chart" :make="makeScatter" caption="50,000 points" />

## Utilisation

::: code-group

```tsx [React]
import { ScatterChart } from "@michi-vz/react";

export default () => <ScatterChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ScatterChart } from "@michi-vz/vue";
</script>

<template>
  <ScatterChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { scatterChart } from "@michi-vz/svelte";
</script>

<div use:scatterChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyScatterChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-scatter-chart #c></michi-vz-scatter-chart>
applyScatterChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-scatter-chart id="c"></michi-vz-scatter-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountScatterChart } from "@michi-vz/core";

const chart = mountScatterChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `ScatterChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu.
