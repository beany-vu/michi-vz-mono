---
title: Treemap
description: "Treemap met tegels geschaald op totaal en een optionele tweedelige splitsing die gerealiseerd versus onbenut aandeel toont; nestelt onder groepen en vouwt op smalle schermen tot een stapel."
---
# Treemap

<span class="vp-badge tip">Samenstelling</span>

"Welke onderdelen zijn het grootst, en hoeveel daarvan is al gerealiseerd?" Een treemap beantwoordt beide tegelijk: elke tegel is geschaald op zijn totaal, en een optionele **tweedelige splitsing** vult het solide aandeel binnen elke tegel - zodat je omvang (oppervlakte) en voortgang (de splitsing) in één oogopslag leest. Het klassieke voorbeeld is exportpotentieel: tegeloppervlakte = totaal potentieel, het solide deel = **gerealiseerd**, het lichtere deel = **onbenut**. Tegels kunnen onder groepen nestelen, en op een smal scherm vouwt het geheel om tot een leesbare **stapel** in één kolom.

<ChartDemo chart="treemap-chart" :legend="[]" />

Liever een platte lijst (één tegel per product, elk zijn eigen kleur - de klassieke exportpotentieel-indeling)? Laat de `children`-nesting weg en geef de bladeren direct door:

<ChartDemo chart="treemap-chart" :index="1" :legend="[]" />

> De splitsing is generiek. Benoem de twee delen met `splitLabels` - `["Realized", "Untapped"]`, `["Used", "Free"]`, `["Done", "Remaining"]` - niets in de engine legt een domein hard vast.

## Wanneer kies je deze

- **Portefeuilleoverzichten.** Honderden producten, sectoren of kostenplaatsen op één scherm: oppervlakte is grootte, de splitsing is voortgang, en de hele hiërarchie past zonder scrollen.
- **"Waar moeten we ons op focussen?"** De grote, grotendeels onbenutte tegels vormen de kansenlijst, zonder dat er gesorteerd hoeft te worden - de klassieke lezing voor exportpotentieel en marktscans.
- **Een dozijn platte categorieën of minder?** Een [staafdiagram](/nl/charts/comparable) of [cirkeldiagram](/nl/charts/pie) leest exacte waarden sneller af dan tegeloppervlaktes; de treemap verdient haar plek pas op schaal.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeTreemap() {
  const sectors = [
    { label: "Industry", color: "#1d3557" },
    { label: "Agri-food", color: "#e9c46a" },
    { label: "Materials", color: "#2a9d8f" },
    { label: "Textiles", color: "#e63946" },
    { label: "Pharmaceuticals", color: "#457b9d" },
    { label: "Energy", color: "#f4a261" },
    { label: "Electronics", color: "#9b5de5" },
    { label: "Services", color: "#06d6a0" },
  ];
  const dataSet = sectors.map((sector, si) => {
    const children = [];
    for (let i = 0; i < 50; i++) {
      const value = 5 + Math.round(Math.random() * 120);
      const partial = Math.round(Math.random() * value);
      children.push({
        label: `${sector.label} product ${si * 50 + i + 1}`,
        value,
        partial,
      });
    }
    return { label: sector.label, color: sector.color, children };
  });
  return { splitLabels: ["Realized", "Untapped"], showLegend: true, layout: "squarify", dataSet };
}
</script>

TreemapChart heeft een optionele `renderer="webgpu"` die de tegels tekent als GPU-instanced rechthoeken, terwijl labels, tooltips en de splitsingsvulling op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU wordt automatisch teruggevallen op canvas, en `getContext().renderer` rapporteert wat daadwerkelijk is getekend.

<WebgpuHeavyDemo element="michi-vz-treemap-chart" :make="makeTreemap" caption="~400 tiles" />

## Gebruik

::: code-group

```tsx [React]
import { TreemapChart } from "@michi-vz/react";

export default () => <TreemapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { TreemapChart } from "@michi-vz/vue";
</script>

<template>
  <TreemapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { treemapChart } from "@michi-vz/svelte";
</script>

<div use:treemapChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyTreemapChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-treemap-chart #c></michi-vz-treemap-chart>
applyTreemapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-treemap-chart id="c"></michi-vz-treemap-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, splitLabels, …
</script>
```

```ts [Vanilla JS]
import { mountTreemapChart } from "@michi-vz/core";

const chart = mountTreemapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Datavorm

Elke `dataSet`-node is een blad (`value`, optionele `partial`) of een ouder (`children`). De waarde van een ouder is de som van zijn bladeren.

```ts
const props = {
  splitLabels: ["Realized", "Untapped"],
  showLegend: true,
  layout: "auto", // squarify on desktop, stack on narrow screens
  dataSet: [
    { label: "Agri-food", children: [
      { label: "Fruits", value: 100, partial: 34 },   // 34% realized
      { label: "Beverages", value: 50, partial: 35 }, // 70% realized
    ]},
    { label: "Industry", children: [
      { label: "Machinery", value: 120, partial: 64 },
    ]},
  ],
};
```

## Responsieve lay-out

`layout` kiest het tegelalgoritme: `"squarify"` (de treemap), `"stack"` (een verticale partitie in één kolom - rijen over de volle breedte, hoogte proportioneel aan de waarde, met dezelfde splitsing per rij), of `"auto"` (schakelt over naar stack onder `stackBreakpoint`, standaard 480px). De splitsing, labels, tooltip, `getContext()` en SVG/canvas-pariteit zijn bij beide lay-outs identiek.

## API

Props zijn getypeerd als `TreemapChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-agnostische [ChartContext](/nl/guide/llm-context). Volledige referentie: [Treemap API](/nl/api/treemap).
