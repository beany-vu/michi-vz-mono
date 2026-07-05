---
title: Verschildiagram
description: "Verschildiagram: zet twee waarden per label uit (voor en na, doel en werkelijk) en de balk daartussen vertelt het verhaal; hoe breder het verschil, hoe luider het spreekt."
---
# Verschildiagram

<span class="vp-badge tip">Vergelijking</span>

Hoe ver liggen de twee waarden die ertoe doen uit elkaar? Zet voor en na, doel en werkelijk, mannen en vrouwen uit, en de balk daartussen vertelt het verhaal - hoe breder het verschil, hoe luider het spreekt.

<ChartDemo chart="gap-chart" />

> De grafiek hierboven gebruikt in elk framework dezelfde **engine** - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Doel versus werkelijk, voor versus na, prognose versus uitkomst.** Twee waarden per rij waarbij de afstand ertussen de hoofdboodschap is - de verschilbalk IS de bevinding.
- **Rangschikken op verschil.** Sorteer de rijen en de grootste overwinningen (of ergste missers) komen meteen naar boven - gemaakt voor het maandagochtendoverzicht van wie het gat heeft gedicht.
- **Doen de absolute groottes er meer toe dan het verschil**, dan houden naast elkaar geplaatste subbalken op een [staafdiagram](/nl/charts/comparable) beide groottes leesbaar.

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

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

GapChart heeft een optionele `renderer="webgpu"` die de value1/value2-markers en verbindende balken tekent als GPU-instanced vormen, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo element="michi-vz-gap-chart" :make="makeGap" caption="~120 rows" />

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
