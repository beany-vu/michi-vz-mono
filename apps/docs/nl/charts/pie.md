---
title: Cirkel / Donut
description: "Cirkel- en donutdiagram: taartpunten geschaald op waarde, gelabeld met percentages, gesorteerd zodat het grootste segment als eerste leest; zet innerRadiusRatio boven 0 voor een donut."
---
# Cirkel / Donut

<span class="vp-badge tip">Samenstelling</span>

"Welk aandeel neemt elk onderdeel van het geheel in?" De oudste vraag in datavisualisatie, en een cirkeldiagram beantwoordt die nog altijd het best wanneer er maar een handvol segmenten zijn. Elk taartpunt is geschaald op waarde en gelabeld met zijn percentage; segmenten worden gesorteerd op waarde zodat het grootste als eerste leest. Liever een donut? Het is **dezelfde grafiek** - zet `innerRadiusRatio` boven 0 om het gat uit te snijden (de context rapporteert dan `mode: "donut"`).

<ChartDemo chart="pie-chart" :legend="false" />

De donutvariant is één prop verwijderd - hier dezelfde aandelen met `innerRadiusRatio: 0.6`, een kleine `padAngle`, en afgeronde hoeken:

<ChartDemo chart="pie-chart" :index="1" :legend="false" />

> Houd het aantal segmenten laag (≈ 6 of minder). Voor veel categorieën leest een [staafdiagram](/nl/charts/comparable) of [treemap](/nl/charts/treemap) preciezer dan een cirkeldiagram.

## Wanneer kies je deze

- **Aandelen voor het bestuur.** Een handvol taartpunten, elk gelabeld met zijn percentage: nog altijd de snelste manier om "wie neemt welk aandeel van het geheel" op een dia te zetten.
- **Dashboard-donuts.** Zet `innerRadiusRatio` en het uitgesneden midden wordt de beste plek voor het kerngetal dat de cirkel bewijst.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

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
  // Geen legenda hier: 40 legenda-pillen doen de demokaart overlopen; hover in plaats daarvan over een taartpunt.
  return { dataSet, showLabels: true, showLegend: false };
}
</script>

PieChart heeft een optionele `renderer="webgpu"` die de segmenten tekent als GPU-getekende bogen, terwijl labels, legenda en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU wordt automatisch teruggevallen op canvas, en `getContext().renderer` rapporteert wat daadwerkelijk is getekend.

<WebgpuHeavyDemo element="michi-vz-pie-chart" :make="makePie" caption="40 slices" />

## Gebruik

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

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

## Datavorm

Elk item in `dataSet` is één segment: een `label`, een `value`, en een optionele `color`.

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

## Cirkel versus donut

Eén engine rendert beide. `innerRadiusRatio` is het gat als fractie van de buitenradius: `0` is een volle cirkel, `0.6` een donut. `padAngle` (radialen) voegt een tussenruimte toe tussen segmenten en `cornerRadius` rondt de hoeken van de boog af. De segmenten, tooltip, `getContext()` en SVG/canvas-pariteit zijn in beide gevallen identiek.

## API

Props zijn getypeerd als `PieChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-agnostische [ChartContext](/nl/guide/llm-context). Volledige referentie: [Cirkel / Donut API](/nl/api/pie).
