---
title: Barres doubles (Tornado)
description: "Graphique en barres doubles (tornade, pyramide des âges) : deux valeurs opposées ancrées à une ligne centrale partagée pour que le déséquilibre se lise d'un coup d'œil."
---
# Barres doubles (Tornado)

<span class="vp-badge tip">Comparaison</span>

Quel côté l'emporte, et de combien ? Ancrez deux valeurs opposées à une ligne centrale partagée et le déséquilibre se lit d'un coup d'œil - gauche vs droite, hommes vs femmes, avant vs après. La classique pyramide des âges et le diagramme en tornade, où la barre la plus longue est l'histoire.

<ChartDemo
  chart="dual-horizontal-bar-chart"
  :legend="[
    { label: 'Hommes (droite, plein)', color: '#3F7CAC' },
    { label: 'Femmes (gauche, pâle)', color: '#95b7d1' },
  ]"
/>

> Le graphique ci-dessus est le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Quand le choisir

- **Quand l'asymétrie est l'histoire.** Pyramides des âges, importations contre exportations, promoteurs contre détracteurs : deux grandeurs opposées sur une même ligne centrale, et le côté déséquilibré parle en premier.
- **Documents de synthèse pour dirigeants.** La barre la plus longue et le côté le plus lourd communiquent avant même qu'un seul chiffre soit lu - idéal quand le public a dix secondes.
- **Si les deux valeurs ne s'opposent pas** (cette année contre l'an dernier, cible contre réel), gardez les deux du même côté de zéro avec une [barre comparable](/fr/charts/comparable).

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeDual() {
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const base = 2 + Math.random() * 18;
    const skew = (Math.random() - 0.5) * 6;
    dataSet.push({
      label: `Row ${i + 1}`,
      value1: Number(Math.max(0.1, base + skew).toFixed(1)),
      value2: Number(Math.max(0.1, base - skew).toFixed(1)),
      color: "#3F7CAC",
    });
  }
  return {
    dataSet,
    title: "120 diverging rows (synthetic)",
    // Labels in the left margin, clear of the left-extending bars.
    yAxisPosition: "left",
    interactiveRowLabels: true,
    margin: { top: 50, right: 50, bottom: 50, left: 120 },
  };
}
</script>

DualHorizontalBarChart dispose d'un `renderer="webgpu"` optionnel qui peint les barres value1/value2 sur le GPU tandis que les axes, étiquettes et infobulles restent sur la couche SVG. C'est conditionné par les capacités du navigateur : sur un navigateur sans WebGPU, il rétrograde automatiquement vers canvas, et `getContext().renderer` indique lequel a effectivement peint.

<WebgpuHeavyDemo element="michi-vz-dual-horizontal-bar-chart" :make="makeDual" caption="~120 lignes" />

## Usage

::: code-group

```tsx [React]
import { DualHorizontalBarChart } from "@michi-vz/react";

export default () => <DualHorizontalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { DualHorizontalBarChart } from "@michi-vz/vue";
</script>

<template>
  <DualHorizontalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { dualHorizontalBarChart } from "@michi-vz/svelte";
</script>

<div use:dualHorizontalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyDualHorizontalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-dual-horizontal-bar-chart #c></michi-vz-dual-horizontal-bar-chart>
applyDualHorizontalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-dual-horizontal-bar-chart id="c"></michi-vz-dual-horizontal-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountDualHorizontalBarChart } from "@michi-vz/core";

const chart = mountDualHorizontalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `DualHorizontalBarChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou expérimentalement `"webgpu"`), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu.
