---
title: Graphique d'écart
description: "Graphique d'écart : tracez deux valeurs par étiquette (avant et après, cible et réel) et la barre entre elles est l'histoire ; plus l'écart est large, plus fort il résonne."
---
# Graphique d'écart

<span class="vp-badge tip">Comparaison</span>

À quel point les deux chiffres qui comptent sont-ils éloignés ? Tracez avant et après, cible et réel, hommes et femmes, et la barre entre eux est l'histoire - plus l'écart est large, plus fort il résonne.

<ChartDemo chart="gap-chart" :legend="false" />

> Le graphique ci-dessus est le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Quand le choisir

- **Cible contre réel, avant contre après, prévision contre résultat.** Deux valeurs par ligne où la distance entre elles est le message principal - la barre d'écart EST la conclusion.
- **Classer par écart.** Triez les lignes et les plus belles réussites (ou les pires échecs) ressortent instantanément - conçu pour la revue du lundi matin : qui a comblé son écart ?
- **Si les valeurs absolues comptent plus que la différence**, des sous-barres côte à côte sur une [barre comparable](/fr/charts/comparable) gardent les deux grandeurs lisibles.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
// Life expectancy at birth, 1990 -> 2023 for ~195 countries, sorted by 2023 value
// and coloured by region. Synthetic but shaped like the real story: nearly every
// country gains, and the lower the 1990 start the bigger the catch-up.
function makeGap() {
  const regions = [
    { name: "Africa", color: "#e07b39", count: 54, base: 50, spread: 9, gain: 11 },
    { name: "Asia", color: "#2a9d8f", count: 48, base: 62, spread: 8, gain: 9 },
    { name: "Americas", color: "#457b9d", count: 35, base: 67, spread: 6, gain: 6 },
    { name: "Europe", color: "#9b5de5", count: 44, base: 72, spread: 4, gain: 6 },
    { name: "Oceania", color: "#d7263d", count: 14, base: 64, spread: 8, gain: 7 },
  ];
  const dataSet = [];
  const colorsMapping = {};
  for (const r of regions) {
    for (let i = 0; i < r.count; i++) {
      const v1990 = r.base + (Math.random() - 0.5) * 2 * r.spread;
      const gain = Math.max(-1.5, r.gain * (0.35 + Math.random() * 0.9));
      const v2023 = Math.min(86, v1990 + gain);
      const label = `${r.name} ${i + 1}`;
      colorsMapping[label] = r.color;
      dataSet.push({
        label,
        code: r.name,
        value1: Math.round(v1990 * 10) / 10,
        value2: Math.round(v2023 * 10) / 10,
        difference: Math.round((v1990 - v2023) * 10) / 10,
        date: "2023",
      });
    }
  }
  // Sorted by where each country ENDS, the wall of dumbbells reads as one sweep.
  dataSet.sort((a, b) => b.value2 - a.value2);
  return {
    title: "Life expectancy at birth: 1990 (circle) to 2023 (triangle), years (synthetic)",
    dataSet,
    colorsMapping,
    xAxisDataType: "number",
    xAxisDomain: [35, 90],
    shapeValue1: "circle",
    shapeValue2: "triangle",
    shapesLabelsMapping: { value1: "1990", value2: "2023", gap: "Gain" },
  };
}
</script>

GapChart dispose d'un `renderer="webgpu"` optionnel qui peint les marqueurs value1/value2 et les barres de connexion comme des formes instanciées sur le GPU tandis que les axes, étiquettes et infobulles restent sur la couche SVG. C'est conditionné par les capacités du navigateur : sur un navigateur sans WebGPU, il rétrograde automatiquement vers canvas, et `getContext().renderer` indique lequel a effectivement peint.

<WebgpuHeavyDemo
  element="michi-vz-gap-chart"
  :make="makeGap"
  :legend="[
    { label: 'Africa', color: '#e07b39' },
    { label: 'Asia', color: '#2a9d8f' },
    { label: 'Americas', color: '#457b9d' },
    { label: 'Europe', color: '#9b5de5' },
    { label: 'Oceania', color: '#d7263d' },
  ]" caption="~195 pays" />

## Usage

::: code-group

```tsx [React]
import { GapChart } from "@michi-vz/react";

export default () => <GapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { GapChart } from "@michi-vz/vue";
</script>

<template>
  <GapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { gapChart } from "@michi-vz/svelte";
</script>

<div use:gapChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyGapChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-gap-chart #c></michi-vz-gap-chart>
applyGapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-gap-chart id="c"></michi-vz-gap-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountGapChart } from "@michi-vz/core";

const chart = mountGapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `GapChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou expérimentalement `"webgpu"`), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu.
