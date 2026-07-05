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
function makeGap() {
  const countries = [
    { label: "United States", code: "USA" },
    { label: "Russia", code: "RUS" },
    { label: "Germany", code: "DEU" },
    { label: "China", code: "CHN" },
    { label: "United Kingdom", code: "GBR" },
    { label: "India", code: "IND" },
    { label: "Brazil", code: "BRA" },
    { label: "Japan", code: "JPN" },
    { label: "France", code: "FRA" },
    { label: "Canada", code: "CAN" },
    { label: "Australia", code: "AUS" },
    { label: "South Africa", code: "ZAF" },
  ];
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const c = countries[i % countries.length];
    const value1 = 2 + Math.random() * 20;
    const value2 = 2 + Math.random() * 20;
    dataSet.push({
      label: `${c.label} #${i}`,
      code: c.code,
      value1,
      value2,
      difference: value1 - value2,
      date: "2023",
    });
  }
  return {
    dataSet,
    xAxisDataType: "number",
    shapeValue1: "circle",
    shapeValue2: "triangle",
    shapesLabelsMapping: { value1: "2010", value2: "2023", gap: "Change" },
  };
}
</script>

GapChart dispose d'un `renderer="webgpu"` optionnel qui peint les marqueurs value1/value2 et les barres de connexion comme des formes instanciées sur le GPU tandis que les axes, étiquettes et infobulles restent sur la couche SVG. C'est conditionné par les capacités du navigateur : sur un navigateur sans WebGPU, il rétrograde automatiquement vers canvas, et `getContext().renderer` indique lequel a effectivement peint.

<WebgpuHeavyDemo element="michi-vz-gap-chart" :make="makeGap" caption="~120 lignes" />

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
