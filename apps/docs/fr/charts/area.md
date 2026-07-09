---
title: Graphique en aires
description: "Graphique en aires empilées pour la composition dans le temps : observez la part de chaque catégorie dans le tout s'étendre ou se réduire pendant que le total augmente."
---
# Graphique en aires

<span class="vp-badge tip">Composition</span>

Le total augmente, mais quelle part le fait grimper ? Empilez vos catégories et observez la part de chacune dans le tout s'étendre ou se réduire dans le temps, pour qu'une marée montante et une composition changeante racontent leurs histoires en même temps.

<ChartDemo chart="area-chart" />

> Le graphique ci-dessus est le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Quand le choisir

- **La composition dans le temps quand le total compte aussi.** Les bandes empilées montrent la part de chaque catégorie tandis que le bord supérieur trace la somme - une marée montante et une composition changeante en une seule image.
- **Les histoires « la répartition change ».** Une part qui s'amincit pendant que le total grossit est un message qu'aucun tableur ne délivre aussi vite - idéal pour les revues de chiffre d'affaires par produit ou de trafic par canal.
- **Quand les rangs se redistribuent, changez de graphique.** Si l'histoire est de savoir qui a dépassé qui, le [graphique en ruban](/fr/charts/ribbon) rend les échanges explicites ; pour un instant unique, un [camembert](/fr/charts/pie) suffit.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeArea() {
  const keys = ["Coal", "Natural gas", "Nuclear", "Wind", "Solar"];
  const base = { Coal: 1500, "Natural gas": 1100, Nuclear: 800, Wind: 180, Solar: 30 };
  const drift = { Coal: -0.6, "Natural gas": 0.3, Nuclear: 0.02, Wind: 0.4, Solar: 0.5 };
  const series = [];
  const rows = 1500;
  for (let i = 0; i < rows; i++) {
    const row = { date: i };
    for (const k of keys) {
      const trend = base[k] + drift[k] * i;
      const noise = (Math.sin(i * 0.37 + k.length) + Math.random() - 0.5) * base[k] * 0.03;
      row[k] = Math.max(0, trend + noise);
    }
    series.push(row);
  }
  return { series, keys, xAxisDataType: "number" };
}

function makeNoDataArea() {
  const keys = ["Raw", "Semi-processed", "Processed"];
  // 24 months, but 2022-04/05/09 and 2023-02/03 are MISSING from the data.
  const present = [
    "2022-01", "2022-02", "2022-03", "2022-06", "2022-07", "2022-08",
    "2022-10", "2022-11", "2022-12", "2023-01", "2023-04", "2023-05",
    "2023-06", "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  ];
  const series = present.map((date, i) => ({
    date,
    Raw: 20 + Math.round(Math.sin(i / 3) * 8),
    "Semi-processed": 30 + Math.round(Math.cos(i / 2) * 6),
    Processed: 50 + Math.round(Math.sin(i / 4) * 5),
  }));
  return {
    series,
    keys,
    xAxisDataType: "date_monthly",
    colorsMapping: { Raw: "#2c6fbb", "Semi-processed": "#e07b39", Processed: "#3aa757" },
    xAxisFormat: (d) => {
      const dt = new Date(Number(d));
      return (
        dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) +
        " " +
        String(dt.getUTCFullYear()).slice(2)
      );
    },
    noDataTickTooltip: () => "No data reported for this month",
  };
}
</script>

AreaChart dispose d'un `renderer="webgpu"` optionnel qui peint les bandes empilées sur le GPU tandis que les axes, étiquettes et infobulles restent sur la couche SVG. C'est conditionné par les capacités du navigateur : sur un navigateur sans WebGPU, il rétrograde automatiquement vers canvas.

<WebgpuHeavyDemo legend element="michi-vz-area-chart" :make="makeArea" caption="~7 500 points" />

## Chronologie continue et graduations sans données

L'axe des x conserve toujours la **première et la dernière période** et incline / réduit les étiquettes trop nombreuses à environ 5. Activez `fillPeriodTicks` pour dessiner une graduation pour **chaque** mois de la plage ; les mois sans données s'affichent **estompés** avec une infobulle « pas de données » au survol. Basculez-le :

<NoDataTicksDemo element="michi-vz-area-chart" :make="makeNoDataArea" />

Personnalisez via `noDataTickTooltip(epochMs)` (texte de l'infobulle) et `noDataTickColor` (ou la variable CSS `--michi-vz-tick-nodata`).

::: code-group

```tsx [React]
<AreaChart
  {...props}
  xAxisDataType="date_monthly"
  fillPeriodTicks
  noDataTickTooltip={() => "No data reported for this month"}
  noDataTickColor="#c0392b"
/>
```

```vue [Vue]
<AreaChart :options="{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }" />
```

```svelte [Svelte]
<div use:areaChart={{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }}></div>
```

```ts [Angular]
applyAreaChartProps(this.c.nativeElement, {
  ...props,
  fillPeriodTicks: true,
  noDataTickTooltip: () => "No data",
});
```

```html [Web component]
<michi-vz-area-chart id="c" fill-period-ticks no-data-tick-color="#c0392b"></michi-vz-area-chart>
<script>
  document.getElementById("c").noDataTickTooltip = () => "No data reported";
</script>
```

:::

## Animation de révélation

Le graphique se dessine de gauche à droite au montage, révélant ses éléments dans l'ordre avant de se stabiliser. Désactivé par défaut - un graphique l'active avec la prop `progressiveDraw`.

<RevealDemo chart="area-chart" replay-label="Rejouer l'animation" hint="Chaque ligne grandit de la première à la dernière année ; l'étiquette suit la pointe puis se pose à l'extrémité de la ligne. Avec reduced motion activé, le graphique s'affiche entièrement tracé, instantanément." />

`progressiveDraw: true` applique les réglages par défaut (1200 ms, easeInOutCubic). Un objet de configuration affine le comportement :

::: code-group

```tsx [React]
const ref = useRef<AreaChartHandle>(null);

<AreaChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() rejoue l'animation à la demande
```

```vue [Vue]
<AreaChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:areaChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyAreaChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-area-chart id="c"></michi-vz-area-chart>
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

Les données couvrent déjà plusieurs années, il n'y a donc rien à taguer. Activez `timeline` : le bouton lecture et le curseur propres au graphique parcourent ces années - à chaque étape, les bandes empilées ne se dessinent que jusqu'à l'année active, et la lecture les prolonge en douceur au fil de l'avancée. Reculez le curseur et les bandes se rétractent en conséquence. Le survol n'inspecte jamais que ce qui est réellement tracé. Désactivé par défaut - sans opt-in, rien ne change.

<TimelinePlayDemo chart="area-chart" hint="Appuyez sur le bouton lecture sous le graphique : le graphique se dessine plus loin jusqu'à chaque année au fil de la lecture. Faites glisser le curseur pour sauter à une année." />

::: code-group

```tsx [React]
const ref = useRef<AreaChartHandle>(null);

<AreaChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<AreaChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:areaChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyAreaChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-area-chart id="c"></michi-vz-area-chart>
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

## Usage

::: code-group

```tsx [React]
import { AreaChart } from "@michi-vz/react";

export default () => <AreaChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { AreaChart } from "@michi-vz/vue";
</script>

<template>
  <AreaChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { areaChart } from "@michi-vz/svelte";
</script>

<div use:areaChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyAreaChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-area-chart #c></michi-vz-area-chart>
applyAreaChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-area-chart id="c"></michi-vz-area-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountAreaChart } from "@michi-vz/core";

const chart = mountAreaChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `AreaChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou expérimentalement `"webgpu"`), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu.
