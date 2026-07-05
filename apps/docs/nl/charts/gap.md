---
title: Verschildiagram
description: "Verschildiagram: zet twee waarden per label uit (voor en na, doel en werkelijk) en de balk daartussen vertelt het verhaal; hoe breder het verschil, hoe luider het spreekt."
---
# Verschildiagram

<span class="vp-badge tip">Vergelijking</span>

Hoe ver liggen de twee waarden die ertoe doen uit elkaar? Zet voor en na, doel en werkelijk, mannen en vrouwen uit, en de balk daartussen vertelt het verhaal - hoe breder het verschil, hoe luider het spreekt.

<ChartDemo chart="gap-chart" :legend="false" />

> De grafiek hierboven gebruikt in elk framework dezelfde **engine** - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Doel versus werkelijk, voor versus na, prognose versus uitkomst.** Twee waarden per rij waarbij de afstand ertussen de hoofdboodschap is - de verschilbalk IS de bevinding.
- **Rangschikken op verschil.** Sorteer de rijen en de grootste overwinningen (of ergste missers) komen meteen naar boven - gemaakt voor het maandagochtendoverzicht van wie het gat heeft gedicht.
- **Doen de absolute groottes er meer toe dan het verschil**, dan houden naast elkaar geplaatste subbalken op een [staafdiagram](/nl/charts/comparable) beide groottes leesbaar.

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

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

GapChart heeft een optionele `renderer="webgpu"` die de value1/value2-markers en verbindende balken tekent als GPU-instanced vormen, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo element="michi-vz-gap-chart" :make="makeGap" caption="~195 landen" />

## Gebruik

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

Props zijn getypeerd als `GapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.
