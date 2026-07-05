---
title: Halterdiagram
description: "Halterdiagram: elke rij plaatst zijn onderdelen achter elkaar met een eindkap bij elke stap, zodat het cumulatieve bereik en het aandeel van elk segment in één oogopslag afleesbaar zijn."
---
# Halterdiagram

<span class="vp-badge tip">Samenstelling</span>

Hoe bouwt een lopend totaal zich op, stap voor stap? Elke rij plaatst zijn onderdelen achter elkaar met een eindkap bij elke stap, zodat het cumulatieve bereik en het aandeel van elk segment allebei in één oogopslag afleesbaar zijn.

<ChartDemo chart="bar-bell-chart" />

> De grafiek hierboven gebruikt in elk framework dezelfde **engine** - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Trechters en cumulatieve opbouw.** Hoe de onderdelen zich rij voor rij opstapelen tot een totaal, met een eindkap die elke stap markeert - pijplijnfases, kostenopbouw, kilometeropbouw.
- **Twee doelgroepen, één rij.** De analist leest de bijdrage van elk segment af aan de kappen; de directie leest het uiteindelijke bereik af aan het einde van de rij. Niemand heeft een tweede grafiek nodig.
- **Weegt het vergelijken van hetzelfde segment tussen rijen zwaarder dan het lopende totaal van elke rij**, dan zet het [verticale gestapelde staafdiagram](/nl/charts/vertical-stack-bar) de segmenten voor je op één lijn.

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeBarBell() {
  const keys = ["Asia-Pacific", "Europe", "North America"];
  const colorsMapping = {
    "Asia-Pacific": "#d62728",
    "Europe": "#2ca02c",
    "North America": "#1f77b4",
  };
  const dataSet = [];
  let asia = 40, europe = 20, america = 10;
  for (let i = 0; i < 120; i++) {
    asia += Math.random() * 12;
    europe += Math.random() * 6;
    america += Math.random() * 4;
    dataSet.push({
      date: String(2000 + i),
      "Asia-Pacific": Math.round(asia),
      "Europe": Math.round(europe),
      "North America": Math.round(america),
    });
  }
  return { dataSet, keys, colorsMapping };
}
</script>

BarBellChart heeft een optionele `renderer="webgpu"` die de segmentbalken en eindkapcirkels tekent als GPU-instanced marks, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo legend element="michi-vz-bar-bell-chart" :make="makeBarBell" caption="~120 rows" />

## Gebruik

::: code-group

```tsx [React]
import { BarBellChart } from "@michi-vz/react";

export default () => <BarBellChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { BarBellChart } from "@michi-vz/vue";
</script>

<template>
  <BarBellChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { barBellChart } from "@michi-vz/svelte";
</script>

<div use:barBellChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyBarBellChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-bar-bell-chart #c></michi-vz-bar-bell-chart>
applyBarBellChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountBarBellChart } from "@michi-vz/core";

const chart = mountBarBellChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props zijn getypeerd als `BarBellChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.
