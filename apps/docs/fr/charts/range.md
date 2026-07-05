---
title: Graphique d'étendue
description: "Graphique d'étendue : colore toute la dispersion par série (meilleur au pire cas, cônes de prévision, bandes de percentiles) pour que l'incertitude soit visible, pas devinée."
---
# Graphique d'étendue

<span class="vp-badge tip">Tendances</span>

« Quelle est l'ampleur de la dispersion ? » Quand une ligne unique ment sur vos données, tracez la bande à la place. Du meilleur au pire cas, le cône de prévision, du 5e au 95e percentile - cela colore toute l'étendue par série pour que l'incertitude soit quelque chose que le lecteur peut voir, pas deviner.

<ChartDemo chart="range-chart" />

> Le graphique ci-dessus utilise le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeRange() {
  const series = [
    { label: "India", color: "#2563eb", base: 6.5, drift: 0.02, spread: 0.8 },
    { label: "United States", color: "#16a34a", base: 2.6, drift: -0.01, spread: 0.6 },
    { label: "China", color: "#dc2626", base: 4.8, drift: -0.03, spread: 0.9 },
    { label: "Germany", color: "#7c3aed", base: 1.2, drift: 0.01, spread: 0.5 },
    { label: "Brazil", color: "#ea580c", base: 2.1, drift: 0.015, spread: 1.1 },
    { label: "Nigeria", color: "#0891b2", base: 3.4, drift: 0.02, spread: 1.3 },
    { label: "Japan", color: "#be185d", base: 0.9, drift: -0.005, spread: 0.4 },
    { label: "Indonesia", color: "#65a30d", base: 5.1, drift: 0.01, spread: 0.9 },
    { label: "France", color: "#9333ea", base: 1.4, drift: 0.005, spread: 0.5 },
    { label: "South Africa", color: "#ca8a04", base: 1.8, drift: -0.02, spread: 1.0 },
  ];
  const pointsPerSeries = 20;
  const dataSet = series.map((s) => {
    const points = [];
    for (let i = 0; i < pointsPerSeries; i++) {
      const year = 2020 + i;
      const wobble = Math.sin(i * 0.7 + s.base) * s.spread * 0.5;
      const mid = s.base + s.drift * i + wobble;
      points.push({
        date: year,
        valueMin: Number((mid - s.spread / 2).toFixed(2)),
        valueMax: Number((mid + s.spread / 2).toFixed(2)),
        valueMedium: Number(mid.toFixed(2)),
        certainty: i < pointsPerSeries - 5,
      });
    }
    return { label: s.label, color: s.color, series: points };
  });
  return { dataSet, xAxisDataType: "date_annual", fillOpacity: 0.55 };
}
</script>

RangeChart possède un `renderer="webgpu"` optionnel qui dessine les bandes min/max comme une géométrie rendue par le GPU tandis que les axes, les libellés et les infobulles restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

<WebgpuHeavyDemo element="michi-vz-range-chart" :make="makeRange" caption="~200 bands" />

## Utilisation

::: code-group

```tsx [React]
import { RangeChart } from "@michi-vz/react";

export default () => <RangeChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RangeChart } from "@michi-vz/vue";
</script>

<template>
  <RangeChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { rangeChart } from "@michi-vz/svelte";
</script>

<div use:rangeChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRangeChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-range-chart #c></michi-vz-range-chart>
applyRangeChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-range-chart id="c"></michi-vz-range-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRangeChart } from "@michi-vz/core";

const chart = mountRangeChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `RangeChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu.
