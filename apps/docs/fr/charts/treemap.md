---
title: Treemap
description: "Treemap avec des tuiles dimensionnées selon le total et une division optionnelle en deux parties montrant la part réalisée par rapport à la part inexploitée ; s'imbrique sous des groupes et se replie en pile sur les écrans étroits."
---
# Treemap

<span class="vp-badge tip">Composition</span>

« Quelles parties sont les plus grosses, et quelle part de chacune est déjà réalisée ? » Un treemap répond aux deux à la fois : chaque tuile est dimensionnée selon son total, et une **division optionnelle en deux parties** remplit la part solide à l'intérieur de chaque tuile - vous lisez ainsi l'ampleur (l'aire) et la progression (la division) en un seul coup d'œil. Le cas classique est le potentiel d'exportation : l'aire de la tuile = le potentiel total, la partie solide = **réalisé**, la partie plus claire = **inexploité**. Les tuiles peuvent s'imbriquer sous des groupes, et sur un écran étroit, l'ensemble se replie en une **pile** lisible sur une seule colonne.

<ChartDemo chart="treemap-chart" :legend="[]" />

Vous préférez une liste plate (une tuile par produit, chacune sa propre couleur - la disposition classique du potentiel d'exportation) ? Retirez l'imbrication `children` et passez les feuilles directement :

<ChartDemo chart="treemap-chart" :index="1" :legend="[]" />

> La division est générique. Nommez les deux parties avec `splitLabels` - `["Realized", "Untapped"]`, `["Used", "Free"]`, `["Done", "Remaining"]` - rien dans le moteur ne code en dur un domaine.

## Quand le choisir

- **Vues de portefeuille.** Des centaines de produits, secteurs ou centres de coûts sur un seul écran : l'aire est la taille, la division est la progression, et toute la hiérarchie tient sans défilement.
- **« Où devrions-nous concentrer nos efforts ? »** Les grandes tuiles majoritairement inexploitées forment la liste des opportunités, sans tri nécessaire - la lecture classique du potentiel d'exportation et de l'analyse de marché.
- **Une douzaine de catégories plates ou moins ?** Une [barre](/fr/charts/comparable) ou un [camembert](/fr/charts/pie) lit les valeurs exactes plus vite que des aires de tuiles ; le treemap gagne sa place à grande échelle.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

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

TreemapChart possède un `renderer="webgpu"` optionnel qui dessine les tuiles comme des rectangles rendus par le GPU tandis que les libellés, les infobulles et le remplissage de la division restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

<WebgpuHeavyDemo legend element="michi-vz-treemap-chart" :make="makeTreemap" caption="~400 tiles" />

## Faire defiler les annees

Étiquetez chaque tuile de premier niveau avec une `date` et activez `timeline` : l'instantané d'une année est constitué des tuiles racines partageant cette date - les enfants n'ont pas besoin de leur propre date - et les tuiles glissent d'une année à l'autre en changeant de taille. Désactivé par défaut - sans opt-in, rien ne change. C'est un défilement interactif année par année, pas l'entrée ponctuelle plus bas.

<TimelinePlayDemo chart="treemap-chart" hint="Appuyez sur le bouton lecture sous le graphique : les données défilent année par année, un instantané à la fois. Faites glisser le curseur pour sauter à une année." />

::: code-group

```tsx [React]
const ref = useRef<TreemapChartHandle>(null);

<TreemapChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<TreemapChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:treemapChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyTreemapChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-treemap-chart id="c"></michi-vz-treemap-chart>
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
- Les tuiles racines sans `date` restent visibles à chaque période.
- `timeline` l'emporte sur `progressiveDraw` quand les deux sont définis - l'animation de révélation plus bas reste inactive tant que le timeline garde la main.

## Animation de révélation

Le graphique se dessine de gauche à droite au montage, révélant ses éléments dans l'ordre avant de se stabiliser. Désactivé par défaut - un graphique l'active avec la prop `progressiveDraw`.

<RevealDemo chart="treemap-chart" replay-label="Rejouer l'animation" hint="Chaque ligne grandit de la première à la dernière année ; l'étiquette suit la pointe puis se pose à l'extrémité de la ligne. Avec reduced motion activé, le graphique s'affiche entièrement tracé, instantanément." />

`progressiveDraw: true` applique les réglages par défaut (1200 ms, easeInOutCubic). Un objet de configuration affine le comportement :

::: code-group

```tsx [React]
const ref = useRef<TreemapChartHandle>(null);

<TreemapChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() rejoue l'animation à la demande
```

```vue [Vue]
<TreemapChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:treemapChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyTreemapChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-treemap-chart id="c"></michi-vz-treemap-chart>
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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

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

## Forme des données

Chaque nœud de `dataSet` est soit une feuille (`value`, `partial` optionnel), soit un parent (`children`). La valeur d'un parent est la somme de ses feuilles.

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

## Disposition adaptative

`layout` choisit l'algorithme de pavage : `"squarify"` (le treemap), `"stack"` (une partition verticale en une seule colonne - lignes pleine largeur, hauteur proportionnelle à la valeur, avec la même division dans chaque ligne), ou `"auto"` (passe en pile en dessous de `stackBreakpoint`, 480px par défaut). La division, les libellés, l'infobulle, `getContext()` et la parité SVG/canvas sont identiques dans les deux dispositions.

## API

Les props sont typées comme `TreemapChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu. Référence complète : [API Treemap](/fr/api/treemap).
