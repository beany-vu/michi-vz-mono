---
title: Radardiagram
description: "Radardiagram voor het vergelijken van opties op basis van gedeelde criteria: elke kandidaat wordt een veelhoek waarvan de pieken en dalen sterktes en zwaktes in één oogopslag tonen."
---
# Radardiagram

<span class="vp-badge tip">Vergelijking</span>

Welke optie wint, en waar? Leg een paar kandidaten over dezelfde set criteria en elk wordt een veelhoek die je in één oogopslag kunt lezen - de pieken tonen elke sterkte, de dalen tonen elke zwakte, en de overlappingen tonen precies waar ze van plaats wisselen.

<ChartDemo chart="radar-chart" />

> De grafiek hierboven is dezelfde **engine** in elk framework - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Scorekaarten.** Leveranciersevaluaties, kandidaatbeoordelingen, productbenchmarks: een paar opties over dezelfde criteria, elk een veelhoek waarvan de pieken en dalen de sterktes en zwaktes zijn.
- **Balans versus specialisatie.** Een rondere veelhoek is de allrounder; een puntige zet alles op twee assen. Dat vormverhaal is wat tabellen niet kunnen vertellen.
- **Houd het bij een paar entiteiten en 5 tot 12 assen.** Voor een precieze vergelijking op één criterium leest een [staafdiagram](/nl/charts/comparable) de exacte waarden af; de radar leest profielen.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

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

RadarChart heeft een optionele `renderer="webgpu"` die de veelhoekvullingen en polmarkers tekent als GPU-instanced marks, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU wordt automatisch teruggevallen op canvas, en `getContext().renderer` rapporteert wat daadwerkelijk is getekend.

<WebgpuHeavyDemo legend element="michi-vz-radar-chart" :make="makeRadar" caption="12 axes × 4 series" />

## Gebruik

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

Props zijn getypeerd als `RadarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-agnostische [ChartContext](/nl/guide/llm-context).
