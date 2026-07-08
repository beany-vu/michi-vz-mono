---
title: Sankey
description: "Sankey-diagram voor stromen: knopen ingedeeld in kolommen waarbij de bandbreedte gelijk is aan de stroomwaarde, voor handel, budgetten en verkeer dat opsplitst en weer samenkomt."
---
# Sankey

<span class="vp-badge tip">Stroom</span>

"Waar gaat het allemaal naartoe?" Een Sankey-diagram brengt de stroom door een systeem in kaart: knopen worden ingedeeld in kolommen, en de **dikte van elke band is de stroomwaarde**. Het is het juiste beeld voor handel tussen exporteurs en markten, budget van bronnen naar bestemmingen, verkeer van verwijzers naar pagina's - overal waar een hoeveelheid onderweg opsplitst en weer samenkomt.

<ChartDemo chart="sankey-chart" />

> De lay-out wordt berekend met [d3-sankey](https://github.com/d3/d3-sankey): knopen worden op basis van de grafiektopologie aan kolommen toegewezen, verticaal gepakt, en verbindingen worden getekend als vloeiende horizontale banden. Hover over een knoop of een stroom voor de bijbehorende cijfers.

## Wanneer kies je deze

- **Stromen met structuur.** Handel tussen exporteurs en markten, budget van bronnen naar bestemmingen, gebruikers door een trechter: waar hoeveelheden vandaan komen, waar ze naartoe gaan, wat opsplitst en weer samenkomt.
- **Het dominante pad en de lekken vinden.** Banddikte is de waarde, dus de dikke routes en de dunne verliezen lees je meteen af - het auditoverzicht van elk systeem.
- **Slechts één fase?** Als er niets *doorheen* stroomt, rangschikt een [staafdiagram](/nl/charts/comparable) bronnen overzichtelijker dan een Sankey met twee kolommen.

## Veel data op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeSankey() {
  const columns = [
    { prefix: "Source", count: 8, color: "#e63946" },
    { prefix: "Hub", count: 12, color: "#1d3557" },
    { prefix: "Region", count: 12, color: "#2a9d8f" },
    { prefix: "Market", count: 8, color: "#e9c46a" },
  ];
  const nodes = [];
  const columnIds = columns.map((col) => []);
  columns.forEach((col, ci) => {
    for (let i = 0; i < col.count; i++) {
      const id = `${col.prefix} ${i + 1}`;
      nodes.push({ id, color: col.color });
      columnIds[ci].push(id);
    }
  });
  const links = [];
  for (let ci = 0; ci < columns.length - 1; ci++) {
    const from = columnIds[ci];
    const to = columnIds[ci + 1];
    // Ensure every node has at least one outgoing and one incoming link.
    from.forEach((source, i) => {
      const target = to[i % to.length];
      links.push({ source, target, value: 5 + Math.round(Math.random() * 45) });
    });
    to.forEach((target, i) => {
      const source = from[i % from.length];
      if (!links.some((l) => l.source === source && l.target === target)) {
        links.push({ source, target, value: 5 + Math.round(Math.random() * 45) });
      }
    });
  }
  // Top up with extra random cross-links (within the same adjacent columns) until ~150.
  let guard = 0;
  while (links.length < 150 && guard < 5000) {
    guard++;
    const ci = Math.floor(Math.random() * (columns.length - 1));
    const from = columnIds[ci];
    const to = columnIds[ci + 1];
    const source = from[Math.floor(Math.random() * from.length)];
    const target = to[Math.floor(Math.random() * to.length)];
    if (links.some((l) => l.source === source && l.target === target)) continue;
    links.push({ source, target, value: 5 + Math.round(Math.random() * 45) });
  }
  return { linkColorMode: "source", nodeRadius: 3, linkRadius: 2, nodes, links };
}
</script>

De optionele `renderer="webgpu"` van deze grafiek tekent de marks op de GPU, terwijl assen/labels/tooltips op SVG blijven; capability-gated met automatische terugval naar canvas.

<WebgpuHeavyDemo
  element="michi-vz-sankey-chart"
  :make="makeSankey"
  :legend="[
    { label: 'Sources', color: '#e63946' },
    { label: 'Hubs', color: '#1d3557' },
    { label: 'Regions', color: '#2a9d8f' },
    { label: 'Markets', color: '#e9c46a' },
  ]" caption="~150 links" />

## Gebruik

::: code-group

```tsx [React]
import { SankeyChart } from "@michi-vz/react";

export default () => <SankeyChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { SankeyChart } from "@michi-vz/vue";
</script>

<template>
  <SankeyChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { sankeyChart } from "@michi-vz/svelte";
</script>

<div use:sankeyChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applySankeyChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-sankey-chart #c></michi-vz-sankey-chart>
applySankeyChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-sankey-chart id="c"></michi-vz-sankey-chart>
<script>
  Object.assign(document.getElementById("c"), props); // nodes, links, …
</script>
```

```ts [Vanilla JS]
import { mountSankeyChart } from "@michi-vz/core";

const chart = mountSankeyChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Datavorm

In tegenstelling tot de andere grafieken neemt een Sankey twee arrays aan: `nodes` (elk met een unieke `id`, een optionele `label` en `color`) en `links` (`source` → `target` op basis van id, met een `value`).

```ts
const props = {
  linkColorMode: "source", // colour links by their source (or "target")
  nodes: [
    { id: "France" }, { id: "Germany" },
    { id: "EU" }, { id: "Asia" },
  ],
  links: [
    { source: "France", target: "EU", value: 40 },
    { source: "France", target: "Asia", value: 22 },
    { source: "Germany", target: "EU", value: 55 },
    { source: "Germany", target: "Asia", value: 35 },
  ],
};
```

Een link naar een onbekende knoop-id (of een knoop in `disabledItems`) wordt met een `datawarning` weggelaten; het uitschakelen van een knoop laat ook de bijbehorende links vervallen.

## Lay-outinstellingen

`nodeWidth` bepaalt de breedte van het knooprechthoek, `nodePadding` de verticale tussenruimte tussen knopen in een kolom, en `linkOpacity` hoe doorschijnend de banden zijn. `linkColorMode` kleurt elke band naar zijn `source`-knoop (standaard) of `target`-knoop. De a11y-spiegel en `getContext()` presenteren de links als een leesbare "Bron → Doel: waarde"-tabel.

**Afgeronde knopen.** `nodeRadius` (px, standaard `2`) rondt de hoeken van het knooprechthoek af - verhoog de waarde voor het pilvormige uiterlijk, of zet hem op `0` voor rechte hoeken. Deze wordt begrensd tot de helft van de kortste zijde van de knoop, zodat een dunne knoop nooit vervormt.

**Afgeronde stromen.** De stromen worden getekend als gevulde linten; `linkRadius` (px, standaard `2`) rondt hun hoeken af waar ze de knopen raken, voor een zachtere verbinding (begrensd tot de helft van de banddikte; `0` = scherp). `linkColorMode` kleurt elke stroom naar zijn `source`- of `target`-knoop, op `linkOpacity`:

```ts
const props = { nodeRadius: 4, linkRadius: 4, /* …nodes, links */ };
```

## API

Props zijn getypeerd als `SankeyChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` retourneren de renderer-agnostische [ChartContext](/nl/guide/llm-context). Volledige referentie: [Sankey API](/nl/api/sankey).
