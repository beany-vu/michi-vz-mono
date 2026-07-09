---
title: Graphique radar
description: "Graphique radar pour comparer des options selon des critères communs : chaque candidat devient un polygone dont les pointes et les creux montrent forces et faiblesses en un coup d'œil."
---
# Graphique radar

<span class="vp-badge tip">Comparaison</span>

Quelle option l'emporte, et sur quels points ? Superposez quelques candidats sur le même ensemble de critères et chacun devient un polygone que vous lisez en un coup d'œil - les pointes montrent chaque force, les creux montrent chaque faiblesse, et les chevauchements montrent exactement où ils échangent leur place.

<ChartDemo chart="radar-chart" />

> Le graphique ci-dessus utilise le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Quand le choisir

- **Grilles d'évaluation.** Évaluations de fournisseurs, appréciations de candidats, comparatifs de produits : quelques options sur les mêmes critères, chacune un polygone dont les pointes et les creux sont ses forces et ses faiblesses.
- **Équilibre contre spécialisation.** Un polygone plus rond est le généraliste ; un polygone pointu mise tout sur deux axes. Cette histoire de forme, aucun tableau ne peut la raconter.
- **Limitez-vous à quelques entités et 5 à 12 axes.** Pour une comparaison précise sur un seul critère, une [barre comparable](/fr/charts/comparable) donne des valeurs exactes ; le radar donne des profils.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeRadar() {
  const axes = [
    "Healthcare", "Education", "Cost of living", "Safety",
    "Environment", "Culture", "Infrastructure", "Climate",
    "Jobs", "Nightlife", "Walkability", "Diversity",
  ];
  const palette = ["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e"];
  const names = ["Vienna", "Singapore", "Lisbon", "Auckland"];
  const series = names.map((label, i) => ({
    label,
    color: palette[i],
    values: axes.map(() => Math.round(20 + Math.random() * 80)),
  }));
  return { axes, series, maxValue: 100, fillOpacity: 0.2 };
}
</script>

RadarChart possède un `renderer="webgpu"` optionnel qui dessine les remplissages des polygones et les marqueurs de pôles comme des marques rendues par le GPU tandis que les axes, les libellés et les infobulles restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

<WebgpuHeavyDemo legend element="michi-vz-radar-chart" :make="makeRadar" caption="12 axes × 4 series" />

## Faire defiler les annees

RadarChart utilise déjà `date` pour l'ancienne forme par axe `{ date, value }`, donc l'étiquette du timeline s'appelle `period` à la place. Étiquetez chaque ligne de série avec une `period` et activez `timeline` : l'instantané d'une année est constitué des lignes partageant cette period, et chaque polygone glisse d'une année à l'autre. Désactivé par défaut - sans opt-in, rien ne change. C'est un défilement interactif année par année, pas l'entrée ponctuelle plus bas.

```ts
{ label: "Vienna", period: "2021", values: [72, 65, 40, 88 /* … */] }
```

<TimelinePlayDemo chart="radar-chart" hint="Appuyez sur le bouton lecture sous le graphique : les données défilent année par année, un instantané à la fois. Faites glisser le curseur pour sauter à une année." />

::: code-group

```tsx [React]
const ref = useRef<RadarChartHandle>(null);

<RadarChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RadarChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:radarChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRadarChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
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
- Les séries sans `period` restent visibles à chaque période.
- `timeline` l'emporte sur `progressiveDraw` quand les deux sont définis - l'animation de révélation plus bas reste inactive tant que le timeline garde la main.

## Animation de révélation

Le graphique se dessine de gauche à droite au montage, révélant ses éléments dans l'ordre avant de se stabiliser. Désactivé par défaut - un graphique l'active avec la prop `progressiveDraw`.

<RevealDemo chart="radar-chart" replay-label="Rejouer l'animation" hint="Chaque ligne grandit de la première à la dernière année ; l'étiquette suit la pointe puis se pose à l'extrémité de la ligne. Avec reduced motion activé, le graphique s'affiche entièrement tracé, instantanément." />

`progressiveDraw: true` applique les réglages par défaut (1200 ms, easeInOutCubic). Un objet de configuration affine le comportement :

::: code-group

```tsx [React]
const ref = useRef<RadarChartHandle>(null);

<RadarChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() rejoue l'animation à la demande
```

```vue [Vue]
<RadarChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:radarChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRadarChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
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
import { RadarChart } from "@michi-vz/react";

export default () => <RadarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RadarChart } from "@michi-vz/vue";
</script>

<template>
  <RadarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { radarChart } from "@michi-vz/svelte";
</script>

<div use:radarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRadarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-radar-chart #c></michi-vz-radar-chart>
applyRadarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `RadarChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu.
