---
title: Graphique en courbes
description: "Graphique en courbes pour séries temporelles : une série ou cinquante, les périodes manquantes s'affichent en pointillés, avec un rendu canvas optionnel à décimation LTTB pour des milliers de points."
---
# Graphique en courbes

<span class="vp-badge tip">Tendances</span>

« Comment cela a-t-il évolué dans le temps, et où ne puis-je pas faire confiance aux données ? » Une série ou cinquante, avec les périodes manquantes affichées en pointillés afin qu'un trou dans les données ne soit jamais lu comme une vraie baisse - plus un rendu canvas optionnel (décimé par LTTB pour les gros volumes) lorsque les points se comptent par milliers.

<ChartDemo chart="line-chart" />

> Le graphique ci-dessus utilise le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeLine() {
  const seriesLabels = [
    { label: "Germany", color: "#1f9e57" },
    { label: "United Kingdom", color: "#2c6fbb" },
    { label: "France", color: "#e63946" },
    { label: "Spain", color: "#e9c46a" },
    { label: "Italy", color: "#2a9d8f" },
    { label: "Poland", color: "#9b5de5" },
    { label: "Sweden", color: "#f4a261" },
    { label: "Netherlands", color: "#264653" },
  ];
  const POINTS_PER_SERIES = 2000;
  const START_YEAR = 1900;
  const dataSet = seriesLabels.map((s, si) => {
    let value = 20 + si * 5;
    const series = [];
    for (let i = 0; i < POINTS_PER_SERIES; i++) {
      value += (Math.random() - 0.5) * 2;
      value = Math.max(0, Math.min(100, value));
      series.push({
        date: START_YEAR + i,
        value: Math.round(value * 100) / 100,
        certainty: true,
      });
    }
    return { label: s.label, color: s.color, series };
  });
  return { dataSet, xAxisDataType: "date_annual", showDataPoints: false };
}

function makeNoDataLine() {
  // 24 months of Jan 2022 - Dec 2023, but several months are MISSING from the data
  // (2022-04/05/09, 2023-02/03) so the "fill" toggle has real gaps to reveal.
  const present = [
    "2022-01", "2022-02", "2022-03", "2022-06", "2022-07", "2022-08",
    "2022-10", "2022-11", "2022-12", "2023-01", "2023-04", "2023-05",
    "2023-06", "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  ];
  const mk = (base, amp) =>
    present.map((date, i) => ({
      date,
      value: Math.round((base + Math.sin(i / 2) * amp) * 10) / 10,
      certainty: true,
    }));
  return {
    dataSet: [
      { label: "Exports", color: "#2c6fbb", series: mk(60, 12) },
      { label: "Imports", color: "#e07b39", series: mk(45, 9) },
    ],
    xAxisDataType: "date_monthly",
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

Le `renderer="webgpu"` optionnel du graphique en courbes dessine la géométrie des lignes/marqueurs sur le GPU, tandis que les axes, les libellés et les infobulles restent sur la couche SVG ; il est conditionné aux capacités du navigateur, avec repli automatique sur canvas lorsque WebGPU n'est pas disponible.

<WebgpuHeavyDemo element="michi-vz-line-chart" :make="makeLine" caption="~16,000 points" />

## Détection des lacunes

Une période manquante s'affiche sous forme de segment **en pointillés** - définissez-le point par point avec `certainty: false`, ou laissez `detectGaps` la déduire automatiquement. Ici, une série saute une période de reporting :

<ChartDemo chart="line-chart" :index="1" />

## Chronologie continue et graduations sans données

Par défaut, l'axe des x reste fidèle au temps de deux manières : **la première et la dernière période ne sont jamais supprimées** (même lorsqu'elles tombent sur un mois « non rond » que d3 aurait sinon ignoré), et les libellés trop nombreux s'inclinent à -45° puis s'éclaircissent jusqu'à environ 5 - en conservant toujours les deux extrémités.

Activez `fillPeriodTicks` et l'axe trace une graduation pour **chaque** période de la plage, pas seulement celles qui ont des données. Les mois sans valeur s'affichent **estompés** ; survolez-en un pour afficher l'explication de la lacune. Basculez l'option :

<NoDataTicksDemo :make="makeNoDataLine" />

Personnalisez-le : `noDataTickTooltip(epochMs)` renvoie le texte de l'infobulle (chaîne simple ou HTML nettoyé), et `noDataTickColor` (ou la variable CSS `--michi-vz-tick-nodata`) définit la couleur estompée.

::: code-group

```tsx [React]
<LineChart
  {...props}
  xAxisDataType="date_monthly"
  fillPeriodTicks
  noDataTickTooltip={() => "No data reported for this month"}
  noDataTickColor="#c0392b"
/>
```

```vue [Vue]
<LineChart :options="{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }" />
```

```svelte [Svelte]
<div use:lineChart={{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }}></div>
```

```ts [Angular]
applyLineChartProps(this.c.nativeElement, {
  ...props,
  fillPeriodTicks: true,
  noDataTickTooltip: () => "No data",
});
```

```html [Web component]
<michi-vz-line-chart id="c" fill-period-ticks no-data-tick-color="#c0392b"></michi-vz-line-chart>
<script>
  document.getElementById("c").noDataTickTooltip = () => "No data reported";
</script>
```

:::

## Utilisation

::: code-group

```tsx [React]
import { LineChart } from "@michi-vz/react";

export default () => <LineChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { LineChart } from "@michi-vz/vue";
</script>

<template>
  <LineChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { lineChart } from "@michi-vz/svelte";
</script>

<div use:lineChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyLineChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-line-chart #c></michi-vz-line-chart>
applyLineChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-line-chart id="c"></michi-vz-line-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## États de chargement et d'absence de données

Passez `isLoading` pendant que votre récupération de données est en cours ; le moteur affiche une superposition `.mv-loading` et définit `data-mv-state="loading"` sur l'hôte.

Lorsque la récupération n'aboutit à rien, `isNodata` prend le relais. Le prédicat par défaut considère qu'un `dataSet` vide (ou que toutes les séries sont vides) signifie l'absence de données - vous pouvez le remplacer par un booléen ou une fonction :

```tsx [React]
// boolean shortcut
<LineChart isLoading={query.isPending} isNodata={query.data?.length === 0} noDataLabel="No data available" />

// function predicate
<LineChart isNodata={(ds) => ds.every(s => s.data.length === 0)} />
```

En React, les props `isNodataComponent` et `isLoadingComponent` acceptent n'importe quel `ReactNode`. Le moteur reste monté (donc `onChartDataProcessed` continue de se déclencher) ; votre nœud est rendu en superposition au-dessus de l'hôte du graphique, et `suppressDefaultOverlay` est activé automatiquement afin que le message intégré `.mv-nodata` soit masqué :

```tsx [React]
<LineChart
  isLoading={isPending}
  isLoadingComponent={<Spinner />}
  isNodata={isEmpty}
  isNodataComponent={<p className="no-data">No results for this selection.</p>}
/>
```

Pour le JS natif / les autres frameworks, la superposition intégrée est affichée par défaut. Désactivez-la et affichez votre propre nœud à côté de l'hôte du graphique :

```ts [Vanilla JS]
const chart = mountLineChart(el, { ...props, suppressDefaultOverlay: true });
// render your overlay next to el when data-mv-state === "nodata"
```

## Configuration des axes

| Prop | Valeur par défaut | Effet |
|---|---|---|
| `yTicks` | `10` | Nombre d'intervalles de graduation de l'axe y |
| `showGridLines` | `true` | Grille horizontale (y) en pointillés |
| `showVerticalGridLines` | `false` | Grille verticale (x) en pointillés |
| `highlightZeroLine` | `true` | Trace y = 0 sous forme de ligne pleine |

La couleur de la ligne zéro reprend par défaut la couleur de la grille (`--michi-vz-grid`). Personnalisez-la indépendamment :

```css
.my-chart-host {
  --michi-vz-zero-line: #e53935; /* solid red zero line */
  --michi-vz-grid: #e0e0e0;      /* dashed gridlines stay grey */
}
```

```tsx [React]
<LineChart
  yTicks={5}
  showGridLines={true}
  showVerticalGridLines={false}
  highlightZeroLine={true}
/>
```

## Famille de police

Passez `fontFamily` pour garder les libellés SVG et le texte canvas synchronisés. Le moteur écrit `--michi-vz-font-family` sur l'hôte du graphique ; les éléments SVG `<text>` et le chemin `ctx.font` du canvas lisent tous deux ce style calculé, donc aucun embarquement de police n'est nécessaire - la famille doit simplement déjà être chargée par la page.

```tsx [React]
<LineChart fontFamily="Inter, sans-serif" />
```

```ts [Vanilla JS]
mountLineChart(el, { ...props, fontFamily: "Inter, sans-serif" });
```

## Couleurs et données de légende

Les couleurs des courbes suivent le **contrat CSS `data-label-safe`**. Chaque élément de série porte un attribut `data-label-safe` (le libellé de série assaini) ; vous le ciblez en CSS pour définir la couleur du trait. Le moteur de rendu canvas sonde ces styles calculés au moment du rendu, de sorte que les mêmes règles CSS pilotent les deux moteurs de rendu.

`onChartDataProcessed` (et `getContext()`) émettent un tableau `legendData` sur le [ChartContext](/fr/guide/llm-context). Chaque entrée a la forme `{ label, color, order, disabled?, dataLabelSafe }`. Une autorité de couleur (par exemple un composant fournisseur) peut lire ces entrées et émettre le CSS correspondant :

```tsx [React]
<LineChart
  onChartDataProcessed={(ctx) => {
    ctx.legendData?.forEach(({ dataLabelSafe, color }) => {
      // write `.line[data-label-safe="${dataLabelSafe}"] { stroke: ${color} }` into a <style> tag
    });
  }}
/>
```

## API

Les props sont typées comme `LineChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu.
