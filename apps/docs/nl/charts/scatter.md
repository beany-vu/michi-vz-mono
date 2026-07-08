---
title: Spreidingsdiagram
description: "Spreidingsdiagram met trend, clusters en uitschieters in één oogopslag; bubbelgrootte draagt een derde variabele en de Pearson-correlatie komt terug in getContext()."
---
# Spreidingsdiagram

<span class="vp-badge tip">Correlatie</span>

Beweegt meer van X écht Y, of jaag je een toeval na? Plot je punten en de trend, de clusters en de uitschieters komen allemaal in één oogopslag naar boven, waarbij de bubbelgrootte er gratis een derde variabele bij geeft. De Pearson-correlatie komt terug in getContext(), zodat je het getal kunt citeren in plaats van naar de wolk te turen.

<ChartDemo chart="scatter-chart" />

> De grafiek hierboven is dezelfde **engine** in elk framework - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Een hypothese testen.** Beweegt uitgavenbudget de conversie? Beweegt anciënniteit het verloop? De wolk, de trend en de uitschieters geven in één oogopslag antwoord, en `getContext()` levert je de Pearson-r die je in het rapport kunt citeren.
- **Segmenten vinden voordat het gemiddelde ze verbergt.** Clusters en uitschieters springen er in een spreidingsdiagram veel eerder uit dan in een samenvattende tabel - de eerste blik van elke analist op een nieuwe dataset.
- **Is één as tijd, gebruik dan een [lijndiagram](/nl/charts/line)** - een spreidingsdiagram behandelt tijd als zomaar een getal en verliest de leesvolgorde die je publiek verwacht.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
// A nod to particle physics: a simulated LHC-style dimuon spectrum. Resonances
// (J/psi, psi(2S), the three Upsilons) sit as sharp vertical bands over a falling
// continuum background - structure you can only see when all 50k events render.
function makeScatter() {
  const g = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pT = () => {
    // Falling pT spectrum; resample the rare high tail instead of clamping
    // (a clamp piles points into a fake line at the top of the plot).
    let v;
    do { v = -8 * Math.log(1 - Math.random()); } while (v > 48);
    return v;
  };
  const resonances = [
    { label: "J/ψ", color: "#e63946", mass: 3.097, width: 0.07, n: 9000 },
    { label: "ψ(2S)", color: "#f4a261", mass: 3.686, width: 0.08, n: 2200 },
    { label: "Υ(1S)", color: "#2a9d8f", mass: 9.46, width: 0.1, n: 5200 },
    { label: "Υ(2S)", color: "#457b9d", mass: 10.023, width: 0.11, n: 2600 },
    { label: "Υ(3S)", color: "#9b5de5", mass: 10.355, width: 0.11, n: 1500 },
  ];
  const dataSet = [];
  const colorsMapping = { "Continuum μμ": "#b8bdc7" };
  // Background FIRST so the resonance points paint on top of it, not under it.
  for (let i = 0; i < 29500; i++) {
    // Continuum: density falls toward high mass, like the real background.
    dataSet.push({ label: "Continuum μμ", x: 2 + 10 * Math.pow(Math.random(), 2.2), y: pT() });
  }
  for (const r of resonances) {
    colorsMapping[r.label] = r.color;
    for (let i = 0; i < r.n; i++) {
      dataSet.push({ label: r.label, x: r.mass + g() * r.width, y: pT() });
    }
  }
  return {
    title: "Simulated dimuon events: invariant mass (GeV) vs pT (GeV)",
    dataSet, colorsMapping,
    xAxisDataType: "number", xAxisDomain: [2, 12], yAxisDomain: [0, 50], sizeRange: [2, 2],
  };
}
</script>

ScatterChart heeft een optionele `renderer="webgpu"` die de puntenwolk tekent als GPU-instanced cirkels, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU wordt automatisch teruggevallen op canvas, en `getContext().renderer` rapporteert wat daadwerkelijk is getekend.

De demo hieronder is een knipoog naar de deeltjesfysica: 50.000 gesimuleerde dimuon-events boven een dalende continuümachtergrond. De scherpe verticale banden zijn de J/ψ-, ψ(2S)- en Υ(1S/2S/3S)-resonanties, dezelfde structuur die een LHC-dimuonspectrum laat zien, en precies het soort puntenwolk waarvoor een GPU-renderer bestaat.

<WebgpuHeavyDemo element="michi-vz-scatter-chart" :make="makeScatter" legend caption="50.000 gesimuleerde dimuon-events" />

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

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
