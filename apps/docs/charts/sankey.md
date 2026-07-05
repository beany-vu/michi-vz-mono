---
title: Sankey
description: "Sankey diagram for flows: nodes laid out in columns with band thickness equal to flow value, for trade, budgets, and traffic that splits and recombines."
---
# Sankey

<span class="vp-badge tip">Flow</span>

"Where does it all go?" A Sankey diagram traces flow through a system: nodes are laid out in columns, and the **thickness of each band is the flow value**. It is the right picture for trade between exporters and markets, budget from sources to uses, traffic from referrers to pages - anywhere a quantity splits and recombines on its way across.

<ChartDemo chart="sankey-chart" />

> Layout is computed with [d3-sankey](https://github.com/d3/d3-sankey): nodes are assigned to columns from the graph topology, packed vertically, and links drawn as smooth horizontal bands. Hover a node or a flow for its figures.

## When to reach for it

- **Flows with structure.** Trade between exporters and markets, budget from sources to uses, users through a funnel: where quantities come from, where they go, what splits and recombines.
- **Finding the dominant path and the leaks.** Band thickness is the value, so the thick routes and the thin losses read instantly - the audit view of any system.
- **Only one stage?** If nothing flows *through*, a [Comparable bar](/charts/comparable) ranks sources more cleanly than a two-column Sankey.

## Heavy data on WebGPU <span class="vp-badge warning">Experimental</span>

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

This chart's opt-in `renderer="webgpu"` paints its marks on the GPU while axes/labels/tooltips stay on SVG; capability-gated with automatic canvas fallback.

<WebgpuHeavyDemo
  element="michi-vz-sankey-chart"
  :make="makeSankey"
  :legend="[
    { label: 'Sources', color: '#e63946' },
    { label: 'Hubs', color: '#1d3557' },
    { label: 'Regions', color: '#2a9d8f' },
    { label: 'Markets', color: '#e9c46a' },
  ]" caption="~150 links" />

## Usage

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

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

## Data shape

Unlike the other charts, a Sankey takes two arrays: `nodes` (each with a unique `id`, an optional `label` and `color`) and `links` (`source` → `target` by id, with a `value`).

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

A link to an unknown node id (or a node in `disabledItems`) is dropped with a `datawarning`; disabling a node drops its links too.

## Layout knobs

`nodeWidth` sets the node rect width, `nodePadding` the vertical gap between nodes in a column, and `linkOpacity` how translucent the bands are. `linkColorMode` colours each band by its `source` (default) or `target` node. The a11y mirror and `getContext()` expose the links as a readable "Source → Target: value" table.

**Rounded nodes.** `nodeRadius` (px, default `2`) rounds the node rect corners - bump it up for the pill look, or set `0` for square corners. It's clamped to half the node's shorter side, so it never deforms a thin node.

**Rounded flows.** The flows are drawn as filled ribbons; `linkRadius` (px, default `2`) rounds their corners where they meet the nodes, for a softer connection (clamped to half the band's thickness; `0` = sharp). `linkColorMode` colours each flow by its `source` or `target` node, at `linkOpacity`:

```ts
const props = { nodeRadius: 4, linkRadius: 4, /* …nodes, links */ };
```

## API

Props are typed as `SankeyChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Shared across all charts: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, or experimental `"webgpu"`), `highlightItems`, `disabledItems`, and the `on*` callbacks. `onChartDataProcessed` / `getContext()` return the renderer-agnostic [ChartContext](/guide/llm-context). Full reference: [Sankey API](/api/sankey).
