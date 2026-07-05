---
title: Spreidingsdiagram
description: "Spreidingsdiagram met trend, clusters en uitschieters in één oogopslag; bubbelgrootte draagt een derde variabele en de Pearson-correlatie komt terug in getContext()."
---
# Spreidingsdiagram

<span class="vp-badge tip">Correlatie</span>

Beweegt meer van X écht Y, of jaag je een toeval na? Plot je punten en de trend, de clusters en de uitschieters komen allemaal in één oogopslag naar boven, waarbij de bubbelgrootte er gratis een derde variabele bij geeft. De Pearson-correlatie komt terug in getContext(), zodat je het getal kunt citeren in plaats van naar de wolk te turen.

<ChartDemo chart="scatter-chart" />

> De grafiek hierboven is dezelfde **engine** in elk framework - alleen de integratiecode hieronder verschilt.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

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

ScatterChart heeft een optionele `renderer="webgpu"` die de puntenwolk tekent als GPU-instanced cirkels, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU wordt automatisch teruggevallen op canvas, en `getContext().renderer` rapporteert wat daadwerkelijk is getekend.

<WebgpuHeavyDemo element="michi-vz-scatter-chart" :make="makeScatter" caption="50,000 points" />

## Gebruik

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

Props zijn getypeerd als `ScatterChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-agnostische [ChartContext](/nl/guide/llm-context).
