---
title: Nuage de points
description: "Nuage de points avec tendance, groupes et valeurs aberrantes en un coup d'œil ; la taille des bulles porte une troisième variable et la corrélation de Pearson revient dans getContext()."
---
# Nuage de points

<span class="vp-badge tip">Corrélation</span>

Est-ce que plus de X fait vraiment bouger Y, ou poursuivez-vous une coïncidence ? Tracez vos points et la tendance, les groupes et les valeurs aberrantes ressortent tous en un coup d'œil, avec la taille des bulles qui porte une troisième variable gratuitement. La corrélation de Pearson revient dans getContext(), pour que vous puissiez citer le chiffre au lieu de scruter le nuage.

<ChartDemo chart="scatter-chart" />

> Le graphique ci-dessus utilise le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Quand le choisir

- **Tester une hypothèse.** Est-ce que les dépenses font bouger la conversion ? Est-ce que l'ancienneté fait bouger le churn ? Le nuage, la tendance et les valeurs aberrantes répondent en un coup d'œil, et `getContext()` vous donne le r de Pearson à citer dans le compte-rendu.
- **Repérer les segments avant que la moyenne ne les cache.** Les groupes et les valeurs aberrantes ressortent d'un nuage de points bien avant d'apparaître dans un tableau récapitulatif - le premier regard de l'analyste sur tout nouveau jeu de données.
- **Si un axe est le temps, utilisez un [graphique en courbes](/fr/charts/line)** - un nuage de points traite le temps comme un simple nombre et perd l'ordre de lecture que votre public attend.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

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

ScatterChart possède un `renderer="webgpu"` optionnel qui dessine le nuage de points comme des cercles rendus par le GPU tandis que les axes, les libellés et les infobulles restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

La démo ci-dessous est un clin d'œil à la physique des particules : 50 000 événements dimuons simulés au-dessus d'un fond continu décroissant. Les bandes verticales nettes sont les résonances J/ψ, ψ(2S) et Υ(1S/2S/3S), la même structure qu'un spectre dimuon du LHC, et exactement le genre de nuage de points pour lequel un moteur GPU existe.

<WebgpuHeavyDemo element="michi-vz-scatter-chart" :make="makeScatter" legend caption="50 000 événements dimuons simulés" />

## Faire defiler les annees

Le geste Gapminder : datez chaque point avec `date`, activez `timeline`, et regardez le nuage dériver année après année avec le bouton lecture et le curseur intégrés. Désactivé par défaut - sans opt-in, rien ne change.

<TimelinePlayDemo chart="scatter" hint="Appuyez sur le bouton lecture sous le graphique : les points dérivent année après année. Faites glisser le curseur pour sauter à une année." />

::: code-group

```tsx [React]
const ref = useRef<ScatterChartHandle>(null);

<ScatterChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<ScatterChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:scatterChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyScatterChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-scatter-chart id="c"></michi-vz-scatter-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` règle le rythme, `loop` reboucle, `autoplay: true` démarre au montage, `showControl: false` masque la barre intégrée.
- Le contrôleur headless reste disponible : `chart.timeline()` expose `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` et `formatPeriod` dans la config pour une UI maison.
- Associez-le à `pointLabels` pour que chaque bulle garde son nom en mouvement ; un `filter` s'applique toujours à l'intérieur de chaque période.
- Les points sans `date` restent visibles à chaque période.

## Utilisation

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

Les props sont typées comme `ScatterChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu.
