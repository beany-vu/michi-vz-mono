---
title: Graphique d'étendue
description: "Graphique d'étendue : colore toute la dispersion par série (meilleur au pire cas, cônes de prévision, bandes de percentiles) pour que l'incertitude soit visible, pas devinée."
---
# Graphique d'étendue

<span class="vp-badge tip">Tendances</span>

« Quelle est l'ampleur de la dispersion ? » Quand une ligne unique ment sur vos données, tracez la bande à la place. Du meilleur au pire cas, le cône de prévision, du 5e au 95e percentile - cela colore toute l'étendue par série pour que l'incertitude soit quelque chose que le lecteur peut voir, pas deviner.

<ChartDemo chart="range-chart" />

> Le graphique ci-dessus utilise le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Quand le choisir

- **Chaque fois qu'une ligne unique exagérerait votre certitude.** Cônes de prévision, bandes du 5e au 95e percentile, scénarios du meilleur au pire cas : la largeur de la bande est la réponse honnête.
- **Comparer la volatilité entre séries.** Une bande large à côté d'une bande étroite est un message sur le risque qu'aucune moyenne ne transmet - écarts de portefeuille, gigue de SLA, plages de température.
- **Des niveaux de confiance imbriqués autour d'une seule prévision ?** C'est exactement ce que le [graphique en éventail](/fr/charts/fan) compose pour vous, bandes et médiane en un seul appel.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeRange() {
  const series = [
    { label: "India", color: "#2563eb", base: 6.5, drift: 0.02, spread: 0.8 },
    { label: "United States", color: "#16a34a", base: 2.6, drift: -0.01, spread: 0.6 },
    { label: "China", color: "#dc2626", base: 4.8, drift: -0.03, spread: 0.9 },
    { label: "Germany", color: "#7c3aed", base: 1.2, drift: 0.01, spread: 0.5 },
    { label: "Brazil", color: "#ea580c", base: 2.1, drift: 0.015, spread: 1.1 },
    { label: "Nigeria", color: "#0891b2", base: 3.4, drift: 0.02, spread: 1.3 },
    { label: "Japan", color: "#be185d", base: 0.9, drift: -0.005, spread: 0.4 },
    { label: "Indonesia", color: "#65a30d", base: 5.1, drift: 0.01, spread: 0.9 },
    { label: "France", color: "#9333ea", base: 1.4, drift: 0.005, spread: 0.5 },
    { label: "South Africa", color: "#ca8a04", base: 1.8, drift: -0.02, spread: 1.0 },
  ];
  const pointsPerSeries = 20;
  const dataSet = series.map((s) => {
    const points = [];
    for (let i = 0; i < pointsPerSeries; i++) {
      const year = 2020 + i;
      const wobble = Math.sin(i * 0.7 + s.base) * s.spread * 0.5;
      const mid = s.base + s.drift * i + wobble;
      points.push({
        date: year,
        valueMin: Number((mid - s.spread / 2).toFixed(2)),
        valueMax: Number((mid + s.spread / 2).toFixed(2)),
        valueMedium: Number(mid.toFixed(2)),
        certainty: i < pointsPerSeries - 5,
      });
    }
    return { label: s.label, color: s.color, series: points };
  });
  return { dataSet, xAxisDataType: "date_annual", fillOpacity: 0.55 };
}
</script>

RangeChart possède un `renderer="webgpu"` optionnel qui dessine les bandes min/max comme une géométrie rendue par le GPU tandis que les axes, les libellés et les infobulles restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

<WebgpuHeavyDemo legend element="michi-vz-range-chart" :make="makeRange" caption="~200 bands" />

## Animation de révélation

Le graphique se dessine de gauche à droite au montage, révélant ses éléments dans l'ordre avant de se stabiliser. Désactivé par défaut - un graphique l'active avec la prop `progressiveDraw`.

<RevealDemo chart="range-chart" replay-label="Rejouer l'animation" hint="Chaque ligne grandit de la première à la dernière année ; l'étiquette suit la pointe puis se pose à l'extrémité de la ligne. Avec reduced motion activé, le graphique s'affiche entièrement tracé, instantanément." />

`progressiveDraw: true` applique les réglages par défaut (1200 ms, easeInOutCubic). Un objet de configuration affine le comportement :

::: code-group

```tsx [React]
const ref = useRef<RangeChartHandle>(null);

<RangeChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() rejoue l'animation à la demande
```

```vue [Vue]
<RangeChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:rangeChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRangeChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-range-chart id="c"></michi-vz-range-chart>
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

Les données couvrent déjà plusieurs années, il n'y a donc rien à taguer. Activez `timeline` : le bouton lecture et le curseur propres au graphique parcourent ces années - à chaque étape, les bandes ne se dessinent que jusqu'à l'année active, et la lecture les prolonge en douceur au fil de l'avancée. Reculez le curseur et les bandes se rétractent en conséquence. Le survol n'inspecte jamais que ce qui est réellement tracé. Désactivé par défaut - sans opt-in, rien ne change.

<TimelinePlayDemo chart="range-chart" hint="Appuyez sur le bouton lecture sous le graphique : le graphique se dessine plus loin jusqu'à chaque année au fil de la lecture. Faites glisser le curseur pour sauter à une année." />

::: code-group

```tsx [React]
const ref = useRef<RangeChartHandle>(null);

<RangeChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RangeChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:rangeChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRangeChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-range-chart id="c"></michi-vz-range-chart>
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
import { RangeChart } from "@michi-vz/react";

export default () => <RangeChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RangeChart } from "@michi-vz/vue";
</script>

<template>
  <RangeChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { rangeChart } from "@michi-vz/svelte";
</script>

<div use:rangeChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRangeChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-range-chart #c></michi-vz-range-chart>
applyRangeChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-range-chart id="c"></michi-vz-range-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRangeChart } from "@michi-vz/core";

const chart = mountRangeChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `RangeChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu.
