---
title: Dubbele staven (Tornado)
description: "Dubbele staven (tornado, bevolkingspiramide): twee tegenover elkaar staande waarden verankerd aan een gedeelde middellijn, zodat de onbalans in één oogopslag afleesbaar is."
---
# Dubbele staven (Tornado)

<span class="vp-badge tip">Vergelijking</span>

Welke kant wint, en met hoeveel? Veranker twee tegenover elkaar staande waarden aan een gedeelde middellijn en de onbalans is in één oogopslag afleesbaar - links versus rechts, mannen versus vrouwen, voor versus na. De klassieke bevolkingspiramide en tornado-grafiek, waarbij de langste balk het verhaal vertelt.

<ChartDemo chart="dual-horizontal-bar-chart" />

> De grafiek hierboven gebruikt in elk framework dezelfde **engine** - alleen de integratiecode hieronder verschilt.

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

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
  return { dataSet, title: "120 diverging rows (synthetic)" };
}
</script>

DualHorizontalBarChart heeft een optionele `renderer="webgpu"` die de value1/value2-balken op de GPU tekent, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo element="michi-vz-dual-horizontal-bar-chart" :make="makeDual" caption="~120 rows" />

## Gebruik

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

Props zijn getypeerd als `DualHorizontalBarChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.
