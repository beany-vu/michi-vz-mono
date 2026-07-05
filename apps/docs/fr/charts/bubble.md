---
title: Graphique à bulles
description: "Graphique à bulles avec un dimensionnement fidèle à l'aire et une disposition par gravité ; chaque bulle peut être divisée en un noyau réalisé et un anneau inexploité, montrant taille et progression ensemble."
---
# Graphique à bulles

<span class="vp-badge tip">Composition</span>

« Quelle est la taille de chacun, et quelle part en est déjà réalisée ? » Un nuage de bulles répond à la question de l'ampleur d'un coup d'œil : chaque cercle est dimensionné par sa valeur (**aire**, pas rayon), et une simulation de gravité les rassemble en une grappe ordonnée pour que les plus grands dominent évidemment. Comme le [treemap](/fr/charts/treemap), chaque bulle peut porter une **division en deux parties** - un noyau réalisé plein à l'intérieur d'un anneau inexploité plus clair - pour lire taille et progression ensemble.

<ChartDemo chart="bubble-chart" :legend="[]" />

Pas besoin de division ? Retirez `partial` pour un nuage proportionnel épuré, une couleur par catégorie :

<ChartDemo chart="bubble-chart" :index="1" :legend="[]" />

> La grappe est disposée avec [d3-force](https://github.com/d3/d3-force) : les bulles tombent vers le centre (`gravity`) et se repoussent pour ne jamais se chevaucher (collision). La simulation est stabilisée **de manière synchrone**, pour que le SVG et le canvas affichent la même disposition identique et reproductible.

## Quand le choisir

- **L'ampleur en un coup d'œil.** Produits, marchés, mots-clés sous forme de nuage dimensionné - quand « lesquels sont grands ? » compte plus qu'un classement exact, la grappe répond instantanément.
- **Cartes d'opportunités.** Avec la division, une grosse bulle au noyau réalisé fin est de l'argent laissé sur la table - la vue de repérage du potentiel pour les revues de portefeuille.
- **Si la position doit signifier quelque chose** (deux axes numériques, une corrélation), c'est un [nuage de points](/fr/charts/scatter) qu'il vous faut ; le nuage de bulles échange la position contre la compacité.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
// Another nod to CERN: one simulated collision event's worth of reconstructed
// energy clusters, one bubble per cluster, area = energy. A falling power-law
// spectrum means a few big deposits over thousands of soft ones - the gravity
// packing turns the event's whole energy budget into one readable cloud.
function makeBubble() {
  const subdetectors = [
    { label: "Tracker", color: "#457b9d", share: 0.38 },
    { label: "ECAL", color: "#2a9d8f", share: 0.3 },
    { label: "HCAL", color: "#e07b39", share: 0.24 },
    { label: "Muon chambers", color: "#9b5de5", share: 0.08 },
  ];
  const dataSet = [];
  let i = 0;
  for (const s of subdetectors) {
    const n = Math.round(1500 * s.share);
    for (let k = 0; k < n; k++) {
      dataSet.push({
        label: `${s.label} #${i++}`,
        // Falling energy spectrum: many soft clusters, a handful of hard ones.
        value: 2 + 200 * Math.pow(Math.random(), 3),
        color: s.color,
      });
    }
  }
  return {
    title: "One simulated collision event: energy clusters, bubble area = energy (GeV)",
    dataSet, gravity: 0.06, padding: 0.5,
    // Chunked async settle + fewer ticks: the multi-second force layout runs in
    // ~12ms slices behind the chart's loading overlay instead of freezing the page.
    layoutMode: "async", settleTicks: 200,
  };
}
</script>

BubbleChart dispose d'un `renderer="webgpu"` optionnel qui peint le nuage de bulles comme des cercles instanciés sur le GPU tandis que les étiquettes et infobulles restent sur la couche SVG. C'est conditionné par les capacités du navigateur : sur un navigateur sans WebGPU, il rétrograde automatiquement vers canvas, et `getContext().renderer` indique lequel a effectivement peint.

Comme la page du nuage de points, la démo ci-dessous emprunte à la physique des particules : ~1 500 amas d'énergie reconstruits d'un événement de collision simulé, une bulle par amas, colorée par sous-détecteur. La poignée de dépôts durs domine des milliers de dépôts mous, et le tassement par gravité transforme tout le budget d'énergie de l'événement en un seul nuage lisible.

<WebgpuHeavyDemo element="michi-vz-bubble-chart" :make="makeBubble" :legend="[
    { label: 'Tracker', color: '#457b9d' },
    { label: 'ECAL', color: '#2a9d8f' },
    { label: 'HCAL', color: '#e07b39' },
    { label: 'Muon chambers', color: '#9b5de5' },
  ]" caption="~1 500 amas d'énergie simulés" />

## Usage

::: code-group

```tsx [React]
import { BubbleChart } from "@michi-vz/react";

export default () => <BubbleChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { BubbleChart } from "@michi-vz/vue";
</script>

<template>
  <BubbleChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { bubbleChart } from "@michi-vz/svelte";
</script>

<div use:bubbleChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyBubbleChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-bubble-chart #c></michi-vz-bubble-chart>
applyBubbleChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-bubble-chart id="c"></michi-vz-bubble-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, splitLabels, …
</script>
```

```ts [Vanilla JS]
import { mountBubbleChart } from "@michi-vz/core";

const chart = mountBubbleChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Forme des données

Chaque élément de `dataSet` est une bulle : une `label`, une `value` (aire), un `partial` optionnel (la sous-partie réalisée), et une `color` optionnelle.

```ts
const props = {
  splitLabels: ["Realized", "Untapped"],
  showLegend: true,
  gravity: 0.09, // higher = tighter cluster
  dataSet: [
    { label: "Germany", value: 120, partial: 64 }, // 53% realized
    { label: "United States", value: 152, partial: 88 },
    { label: "China", value: 168, partial: 51 },
  ],
};
```

## Gravité et la division

`gravity` définit avec quelle force les bulles sont attirées vers le centre (plus élevé = grappe plus serrée), `padding` l'écart entre elles, et `fillRatio` quelle part de la zone de tracé le nuage occupe. La division reflète le treemap : `partial` découpe un noyau réalisé fidèle à l'aire (rayon `r·√(partial/value)`), et le reste se lit comme une teinte plus claire de la même couleur - une couleur pleine sous un voile blanc, pour fonctionner sur fond clair **et** sombre. Nommez les parties avec `splitLabels`.

## API

Les props sont typées comme `BubbleChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou expérimentalement `"webgpu"`), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu. Référence complète : [API Bubble](/fr/api/bubble).
