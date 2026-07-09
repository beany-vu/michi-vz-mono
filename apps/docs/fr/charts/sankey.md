---
title: Sankey
description: "Diagramme de Sankey pour les flux : des nœuds disposés en colonnes avec une épaisseur de bande égale à la valeur du flux, pour le commerce, les budgets et le trafic qui se divise et se recombine."
---
# Sankey

<span class="vp-badge tip">Flux</span>

« Où tout cela va-t-il ? » Un diagramme de Sankey retrace le flux à travers un système : les nœuds sont disposés en colonnes, et l'**épaisseur de chaque bande représente la valeur du flux**. C'est l'image qu'il faut pour le commerce entre exportateurs et marchés, le budget des sources vers les usages, le trafic des référents vers les pages - partout où une quantité se divise et se recombine sur son parcours.

<ChartDemo chart="sankey-chart" />

> La disposition est calculée avec [d3-sankey](https://github.com/d3/d3-sankey) : les nœuds sont assignés à des colonnes à partir de la topologie du graphe, empilés verticalement, et les liens sont dessinés comme des bandes horizontales lissées. Survolez un nœud ou un flux pour voir ses chiffres.

## Quand le choisir

- **Des flux structurés.** Commerce entre exportateurs et marchés, budget des sources vers les usages, utilisateurs à travers un entonnoir : d'où viennent les quantités, où elles vont, ce qui se divise et se recombine.
- **Repérer le chemin dominant et les fuites.** L'épaisseur des bandes est la valeur, si bien que les grandes routes et les petites pertes se lisent instantanément - la vue d'audit de n'importe quel système.
- **Une seule étape ?** Si rien ne traverse *à travers*, une [barre comparable](/fr/charts/comparable) classe les sources plus proprement qu'un Sankey à deux colonnes.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

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

Le `renderer="webgpu"` optionnel de ce graphique dessine ses marques sur le GPU tandis que les axes/libellés/infobulles restent sur SVG ; conditionné aux capacités du navigateur, avec repli automatique sur canvas.

<WebgpuHeavyDemo
  element="michi-vz-sankey-chart"
  :make="makeSankey"
  :legend="[
    { label: 'Sources', color: '#e63946' },
    { label: 'Hubs', color: '#1d3557' },
    { label: 'Regions', color: '#2a9d8f' },
    { label: 'Markets', color: '#e9c46a' },
  ]" caption="~150 links" />

## Faire defiler les annees

Étiquetez chaque lien avec une `date` et activez `timeline` : l'instantané d'une année est constitué des liens partageant cette date - les nœuds restent partagés d'une année à l'autre, seuls les flux vont et viennent - et l'épaisseur des bandes glisse d'une année à l'autre. Désactivé par défaut - sans opt-in, rien ne change. C'est un défilement interactif année par année, pas l'entrée ponctuelle plus bas.

<TimelinePlayDemo chart="sankey-chart" hint="Appuyez sur le bouton lecture sous le graphique : les données défilent année par année, un instantané à la fois. Faites glisser le curseur pour sauter à une année." />

::: code-group

```tsx [React]
const ref = useRef<SankeyChartHandle>(null);

<SankeyChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<SankeyChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:sankeyChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applySankeyChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-sankey-chart id="c"></michi-vz-sankey-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` règle le rythme, `loop` reboucle, `autoplay: true` démarre au montage, `showControl: false` masque la barre intégrée.
- Les valeurs glissent d'une période à l'autre par défaut (`interpolate`) ; ajustez le mouvement avec `tweenMs` et `easing`, ou passez `interpolate: false` pour des coupes nettes. Avec reduced motion, la coupe est toujours nette.
- Le contrôleur headless reste disponible : `chart.timeline()` expose `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` et `formatPeriod` dans la config pour une UI maison.
- Les liens sans `date` restent visibles à chaque période.
- `timeline` l'emporte sur `progressiveDraw` quand les deux sont définis - l'animation de révélation plus bas reste inactive tant que le timeline garde la main.

## Animation de révélation

Le graphique se dessine de gauche à droite au montage, révélant ses éléments dans l'ordre avant de se stabiliser. Désactivé par défaut - un graphique l'active avec la prop `progressiveDraw`.

<RevealDemo chart="sankey-chart" replay-label="Rejouer l'animation" hint="Chaque ligne grandit de la première à la dernière année ; l'étiquette suit la pointe puis se pose à l'extrémité de la ligne. Avec reduced motion activé, le graphique s'affiche entièrement tracé, instantanément." />

`progressiveDraw: true` applique les réglages par défaut (1200 ms, easeInOutCubic). Un objet de configuration affine le comportement :

::: code-group

```tsx [React]
const ref = useRef<SankeyChartHandle>(null);

<SankeyChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() rejoue l'animation à la demande
```

```vue [Vue]
<SankeyChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:sankeyChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applySankeyChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-sankey-chart id="c"></michi-vz-sankey-chart>
<script>
  const el = document.getElementById("c");
  el.progressiveDraw = { durationMs: 2000 };
  // el.replay() rejoue l'animation
</script>
```

:::

- `durationMs` et `easing` ("linear", "easeOutQuad", "easeInOutCubic", ou une fonction `(t) => t` personnalisée) façonnent le rythme du tracé.
- `autoplay: false` rend le graphique entièrement tracé ; appelez `replay()` (handle de ref React, méthode du web component ou instance core) pour lancer l'animation à la demande. `replayOnUpdate: true` la rejoue à chaque changement de données.
- Respecte `prefers-reduced-motion` : le graphique s'affiche alors entièrement tracé, instantanément.
- L'animation de révélation est une entrée ponctuelle ; le défilement par année ci-dessus avance plutôt année par année.

## Utilisation

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

## Forme des données

Contrairement aux autres graphiques, un Sankey prend deux tableaux : `nodes` (chacun avec un `id` unique, un `label` et une `color` optionnels) et `links` (`source` → `target` par id, avec une `value`).

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

Un lien vers un id de nœud inconnu (ou un nœud dans `disabledItems`) est supprimé avec un `datawarning` ; désactiver un nœud supprime aussi ses liens.

## Réglages de disposition

`nodeWidth` définit la largeur du rectangle du nœud, `nodePadding` l'écart vertical entre les nœuds d'une colonne, et `linkOpacity` la translucidité des bandes. `linkColorMode` colore chaque bande selon son nœud `source` (par défaut) ou `target`. Le miroir d'accessibilité et `getContext()` exposent les liens sous forme de tableau lisible « Source → Target : valeur ».

**Nœuds arrondis.** `nodeRadius` (px, par défaut `2`) arrondit les coins du rectangle du nœud - augmentez-le pour un aspect « pilule », ou mettez `0` pour des coins carrés. Il est plafonné à la moitié du côté le plus court du nœud, afin de ne jamais déformer un nœud fin.

**Flux arrondis.** Les flux sont dessinés comme des rubans remplis ; `linkRadius` (px, par défaut `2`) arrondit leurs coins à la jonction avec les nœuds, pour une connexion plus douce (plafonné à la moitié de l'épaisseur de la bande ; `0` = coins nets). `linkColorMode` colore chaque flux selon son nœud `source` ou `target`, à l'opacité `linkOpacity` :

```ts
const props = { nodeRadius: 4, linkRadius: 4, /* …nodes, links */ };
```

## API

Les props sont typées comme `SankeyChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu. Référence complète : [API Sankey](/fr/api/sankey).
