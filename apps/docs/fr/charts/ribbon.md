---
title: Graphique en ruban
description: "Graphique en ruban pour les changements de rang et de part : des rubans relient les colonnes de chaque période afin de suivre une catégorie qui gonfle, se réduit et change de place."
---
# Graphique en ruban

<span class="vp-badge tip">Composition</span>

Qui progresse et qui recule ? Quand les parts de marché, la répartition budgétaire ou les résultats d'un vote se redistribuent d'une période à l'autre, les rubans reliant chaque colonne vous permettent de suivre une seule catégorie tandis qu'elle gonfle, se réduit, et échange sa place avec ses rivales.

<ChartDemo chart="ribbon-chart" />

> Le graphique ci-dessus utilise le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Quand le choisir

- **Parts de marché, répartitions budgétaires, classements.** Quand les catégories échangent leur place d'une période à l'autre, les rubans font de « qui a dépassé qui, et quand » la première chose que les lecteurs voient.
- **Présenter des redistributions à un public professionnel.** Chaque catégorie garde sa couleur pendant qu'elle gonfle, se réduit et change de rang, pour que l'œil suive un même concurrent tout au long de l'histoire.
- **Si aucun rang ne change jamais**, les rubans restent parallèles et un [graphique en aires](/fr/charts/area) raconte la même histoire de parts avec moins d'encre.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeRibbon() {
  const keys = Array.from({ length: 30 }, (_, i) => `Category ${i + 1}`);
  const palette = [
    "#e63946", "#1d3557", "#2a9d8f", "#e9c46a", "#9b5de5",
    "#f15bb5", "#00bbf9", "#00f5d4", "#fee440", "#4cb944",
  ];
  const colorsMapping = {};
  keys.forEach((k, i) => { colorsMapping[k] = palette[i % palette.length]; });
  // Each key gets a slowly drifting base weight so ribbons visibly swell/shrink/re-rank.
  const bases = keys.map(() => 2 + Math.random() * 8);
  const drifts = keys.map(() => (Math.random() - 0.5) * 0.8);
  const series = [];
  for (let p = 0; p < 15; p++) {
    const row = { date: `${2010 + p}` };
    keys.forEach((k, i) => {
      const wobble = Math.sin(p * 0.7 + i) * 1.5;
      row[k] = Math.max(0.5, bases[i] + drifts[i] * p + wobble);
    });
    series.push(row);
  }
  return { series, keys, colorsMapping };
}
</script>

RibbonChart possède un `renderer="webgpu"` optionnel qui dessine ses rubans sur le GPU tandis que les axes, les libellés et les infobulles restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

<WebgpuHeavyDemo element="michi-vz-ribbon-chart" :make="makeRibbon" caption="dense ribbons" />

## Animation de révélation

Le graphique se dessine de gauche à droite au montage, révélant ses éléments dans l'ordre avant de se stabiliser. Désactivé par défaut - un graphique l'active avec la prop `progressiveDraw`.

<RevealDemo chart="ribbon-chart" replay-label="Rejouer l'animation" hint="Chaque ligne grandit de la première à la dernière année ; l'étiquette suit la pointe puis se pose à l'extrémité de la ligne. Avec reduced motion activé, le graphique s'affiche entièrement tracé, instantanément." />

`progressiveDraw: true` applique les réglages par défaut (1200 ms, easeInOutCubic). Un objet de configuration affine le comportement :

::: code-group

```tsx [React]
const ref = useRef<RibbonChartHandle>(null);

<RibbonChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() rejoue l'animation à la demande
```

```vue [Vue]
<RibbonChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:ribbonChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRibbonChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
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

## Faire defiler les annees

Les données couvrent déjà plusieurs années, il n'y a donc rien à taguer. Activez `timeline` : le bouton lecture et le curseur propres au graphique parcourent ces années - à chaque étape, les rubans ne se dessinent que jusqu'à l'année active, et la lecture les prolonge en douceur au fil de l'avancée. Reculez le curseur et les rubans se rétractent en conséquence. Le survol n'inspecte jamais que ce qui est réellement tracé. Désactivé par défaut - sans opt-in, rien ne change.

<TimelinePlayDemo chart="ribbon-chart" hint="Appuyez sur le bouton lecture sous le graphique : le graphique se dessine plus loin jusqu'à chaque année au fil de la lecture. Faites glisser le curseur pour sauter à une année." />

::: code-group

```tsx [React]
const ref = useRef<RibbonChartHandle>(null);

<RibbonChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RibbonChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:ribbonChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRibbonChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` règle le rythme, `loop` reboucle, `autoplay: true` démarre au montage, `showControl: false` masque la barre intégrée.
- Le contrôleur headless reste disponible : `chart.timeline()` expose `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` et `formatPeriod` dans la config pour une UI maison.
- Les valeurs glissent entre les années par défaut (`interpolate`) ; passez `interpolate: false` pour des coupes nettes. Avec reduced motion, la coupe est toujours nette.
- `timeline` l'emporte sur `progressiveDraw` quand les deux sont définis sur le même graphique.

## Utilisation

::: code-group

```tsx [React]
import { RibbonChart } from "@michi-vz/react";

export default () => <RibbonChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RibbonChart } from "@michi-vz/vue";
</script>

<template>
  <RibbonChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { ribbonChart } from "@michi-vz/svelte";
</script>

<div use:ribbonChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRibbonChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-ribbon-chart #c></michi-vz-ribbon-chart>
applyRibbonChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRibbonChart } from "@michi-vz/core";

const chart = mountRibbonChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `RibbonChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu.
