---
title: Barre-haltère
description: "Graphique en barre-haltère : chaque ligne dispose ses parties bout à bout avec un embout à chaque étape, pour que la portée cumulative et la part de chaque segment se lisent d'un coup d'œil."
---
# Barre-haltère

<span class="vp-badge tip">Composition</span>

Comment un total cumulé s'accumule-t-il, morceau par morceau ? Chaque ligne dispose ses parties bout à bout avec un embout à chaque étape, pour que la portée cumulative et la part de chaque segment se lisent toutes deux d'un coup d'œil.

<ChartDemo chart="bar-bell-chart" />

> Le graphique ci-dessus est le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Quand le choisir

- **Entonnoirs et cumuls progressifs.** Comment les parties s'additionnent jusqu'à un total, ligne par ligne, avec un embout marquant chaque étape - étapes de pipeline, cumuls de coûts, accumulations de kilométrage.
- **Deux publics, une seule ligne.** L'analyste lit la contribution de chaque segment sur les embouts ; le dirigeant lit la portée finale à l'extrémité de la ligne. Personne n'a besoin d'un second graphique.
- **Si comparer le même segment entre les lignes compte plus que le total cumulé de chaque ligne**, les [barres empilées verticales](/fr/charts/vertical-stack-bar) alignent les segments pour vous.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeBarBell() {
  const keys = ["Asia-Pacific", "Europe", "North America"];
  const colorsMapping = {
    "Asia-Pacific": "#d62728",
    "Europe": "#2ca02c",
    "North America": "#1f77b4",
  };
  const dataSet = [];
  let asia = 40, europe = 20, america = 10;
  for (let i = 0; i < 120; i++) {
    asia += Math.random() * 12;
    europe += Math.random() * 6;
    america += Math.random() * 4;
    dataSet.push({
      date: String(2000 + i),
      "Asia-Pacific": Math.round(asia),
      "Europe": Math.round(europe),
      "North America": Math.round(america),
    });
  }
  return { dataSet, keys, colorsMapping };
}
</script>

BarBellChart dispose d'un `renderer="webgpu"` optionnel qui peint les barres de segment et les cercles d'extrémité comme des marques instanciées sur le GPU tandis que les axes, étiquettes et infobulles restent sur la couche SVG. C'est conditionné par les capacités du navigateur : sur un navigateur sans WebGPU, il rétrograde automatiquement vers canvas, et `getContext().renderer` indique lequel a effectivement peint.

<WebgpuHeavyDemo legend element="michi-vz-bar-bell-chart" :make="makeBarBell" caption="~120 lignes" />

## Faire defiler les annees

BarBellChart utilise déjà `date` pour la catégorie de la ligne (la bande sur l'axe des y), donc l'étiquette du timeline s'appelle `period` à la place. Étiquetez chaque ligne avec une `period` et activez `timeline` : l'instantané d'une année est constitué des lignes partageant cette period, et la longueur de chaque segment glisse d'une année à l'autre. Désactivé par défaut - sans opt-in, rien ne change. C'est un défilement interactif année par année, pas l'entrée ponctuelle plus bas.

```ts
{ period: "2021", date: "Kenya", exports: 40, domestic: 25 }
```

<TimelinePlayDemo chart="bar-bell-chart" hint="Appuyez sur le bouton lecture sous le graphique : les données défilent année par année, un instantané à la fois. Faites glisser le curseur pour sauter à une année." />

::: code-group

```tsx [React]
const ref = useRef<BarBellChartHandle>(null);

<BarBellChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<BarBellChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:barBellChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyBarBellChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
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
- Les lignes sans `period` restent visibles à chaque période.
- `timeline` l'emporte sur `progressiveDraw` quand les deux sont définis - l'animation de révélation plus bas reste inactive tant que le timeline garde la main.

## Animation de révélation

Le graphique se dessine de gauche à droite au montage, révélant ses éléments dans l'ordre avant de se stabiliser. Désactivé par défaut - un graphique l'active avec la prop `progressiveDraw`.

<RevealDemo chart="bar-bell-chart" replay-label="Rejouer l'animation" hint="Chaque ligne grandit de la première à la dernière année ; l'étiquette suit la pointe puis se pose à l'extrémité de la ligne. Avec reduced motion activé, le graphique s'affiche entièrement tracé, instantanément." />

`progressiveDraw: true` applique les réglages par défaut (1200 ms, easeInOutCubic). Un objet de configuration affine le comportement :

::: code-group

```tsx [React]
const ref = useRef<BarBellChartHandle>(null);

<BarBellChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() rejoue l'animation à la demande
```

```vue [Vue]
<BarBellChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:barBellChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyBarBellChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
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

## Usage

::: code-group

```tsx [React]
import { BarBellChart } from "@michi-vz/react";

export default () => <BarBellChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { BarBellChart } from "@michi-vz/vue";
</script>

<template>
  <BarBellChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { barBellChart } from "@michi-vz/svelte";
</script>

<div use:barBellChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyBarBellChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-bar-bell-chart #c></michi-vz-bar-bell-chart>
applyBarBellChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountBarBellChart } from "@michi-vz/core";

const chart = mountBarBellChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `BarBellChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou expérimentalement `"webgpu"`), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu.
