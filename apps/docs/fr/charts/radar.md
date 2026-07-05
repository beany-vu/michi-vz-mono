---
title: Graphique radar
description: "Graphique radar pour comparer des options selon des critères communs : chaque candidat devient un polygone dont les pointes et les creux montrent forces et faiblesses en un coup d'œil."
---
# Graphique radar

<span class="vp-badge tip">Comparaison</span>

Quelle option l'emporte, et sur quels points ? Superposez quelques candidats sur le même ensemble de critères et chacun devient un polygone que vous lisez en un coup d'œil - les pointes montrent chaque force, les creux montrent chaque faiblesse, et les chevauchements montrent exactement où ils échangent leur place.

<ChartDemo chart="radar-chart" />

> Le graphique ci-dessus utilise le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Quand le choisir

- **Grilles d'évaluation.** Évaluations de fournisseurs, appréciations de candidats, comparatifs de produits : quelques options sur les mêmes critères, chacune un polygone dont les pointes et les creux sont ses forces et ses faiblesses.
- **Équilibre contre spécialisation.** Un polygone plus rond est le généraliste ; un polygone pointu mise tout sur deux axes. Cette histoire de forme, aucun tableau ne peut la raconter.
- **Limitez-vous à quelques entités et 5 à 12 axes.** Pour une comparaison précise sur un seul critère, une [barre comparable](/fr/charts/comparable) donne des valeurs exactes ; le radar donne des profils.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeRadar() {
  const axes = [
    "Healthcare", "Education", "Cost of living", "Safety",
    "Environment", "Culture", "Infrastructure", "Climate",
    "Jobs", "Nightlife", "Walkability", "Diversity",
  ];
  const palette = ["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e"];
  const names = ["Vienna", "Singapore", "Lisbon", "Auckland"];
  const series = names.map((label, i) => ({
    label,
    color: palette[i],
    values: axes.map(() => Math.round(20 + Math.random() * 80)),
  }));
  return { axes, series, maxValue: 100, fillOpacity: 0.2 };
}
</script>

RadarChart possède un `renderer="webgpu"` optionnel qui dessine les remplissages des polygones et les marqueurs de pôles comme des marques rendues par le GPU tandis que les axes, les libellés et les infobulles restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

<WebgpuHeavyDemo element="michi-vz-radar-chart" :make="makeRadar" caption="12 axes × 4 series" />

## Utilisation

::: code-group

```tsx [React]
import { RadarChart } from "@michi-vz/react";

export default () => <RadarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RadarChart } from "@michi-vz/vue";
</script>

<template>
  <RadarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { radarChart } from "@michi-vz/svelte";
</script>

<div use:radarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRadarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-radar-chart #c></michi-vz-radar-chart>
applyRadarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `RadarChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu.
