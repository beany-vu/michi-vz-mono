---
title: Barres comparables verticales
description: "Graphique en barres comparables verticales : deux colonnes superposées en pleine largeur par catégorie - une valeur de base derrière, une valeur comparée devant - avec une flèche de variation au-dessus de chaque paire. La cible de migration verticale du legacy sdg-trade BarchartVertical."
---
# Barres comparables verticales

<span class="vp-badge tip">Comparaison</span>

Est-ce que ça s'est amélioré ou dégradé, catégorie par catégorie ? Chaque colonne superpose deux barres pleine largeur - la valeur de référence derrière, la valeur actuelle devant - avec une flèche de variation + une étiquette qui donne l'écart en un coup d'œil.

<ChartDemo
  chart="comparable-vertical-bar-chart"
  :legend="[
    { label: '2019 (base, teinte pâle, derrière)', color: '#b1b1b1' },
    { label: '2024 (comparé, plein, devant)', color: '#6e6e6e' },
  ]"
/>

> Le graphique ci-dessus est le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeComparableVertical() {
  const colors = ["#c0392b", "#2c6fbb", "#1f1f1f", "#e07b39", "#2e8b57", "#8e44ad", "#16a085"];
  const dataSet = [];
  for (let i = 0; i < 60; i++) {
    const base = 50 + Math.round(Math.random() * 950);
    const compared = Math.max(1, Math.round(base * (0.6 + Math.random() * 0.8)));
    dataSet.push({
      label: `Sector ${i + 1}`,
      valueBased: base,
      valueCompared: compared,
      color: colors[i % colors.length],
    });
  }
  return { title: "Sector export value: 2019 vs 2024, US$ bn (synthetic)", dataSet };
}
</script>

ComparableVerticalBarChart dispose d'un `renderer="webgpu"` optionnel qui peint les deux sous-barres par colonne comme des rectangles instanciés sur le GPU, tandis que les axes, étiquettes et l'indicateur de variation restent sur la couche SVG. C'est conditionné par les capacités du navigateur : sur un navigateur sans WebGPU, il rétrograde automatiquement vers canvas, et `getContext().renderer` indique lequel a effectivement peint.

<WebgpuHeavyDemo element="michi-vz-comparable-vertical-bar-chart" :make="makeComparableVertical" caption="~60 colonnes" />

## Faire defiler les annees

Donnez un `date` à chaque catégorie et activez `timeline` : le graphique en colonnes devient un récit année par année, avec son propre bouton lecture et son curseur, un instantané de la paire base/comparé à la fois. Désactivé par défaut - sans opt-in, rien ne change.

<TimelinePlayDemo chart="comparable-vertical-bar-chart" hint="Appuyez sur le bouton lecture sous le graphique : les données défilent année après année, un instantané à la fois. Faites glisser le curseur pour sauter à une année." />

::: code-group

```tsx [React]
const ref = useRef<ComparableVerticalBarChartHandle>(null);

<ComparableVerticalBarChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<ComparableVerticalBarChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:comparableVerticalBarChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyComparableVerticalBarChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-comparable-vertical-bar-chart id="c"></michi-vz-comparable-vertical-bar-chart>
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
- Un `filter` (top-N, tri) s'applique toujours à l'intérieur de chaque période : un « top 5 par an » fonctionne d'emblée.
- Les colonnes sans `date` restent visibles à chaque période.

## Usage

::: code-group

```tsx [React]
import { ComparableVerticalBarChart } from "@michi-vz/react";

export default () => <ComparableVerticalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ComparableVerticalBarChart } from "@michi-vz/vue";
</script>

<template>
  <ComparableVerticalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { comparableVerticalBarChart } from "@michi-vz/svelte";
</script>

<div use:comparableVerticalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyComparableVerticalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-comparable-vertical-bar-chart #c></michi-vz-comparable-vertical-bar-chart>
applyComparableVerticalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-comparable-vertical-bar-chart id="c"></michi-vz-comparable-vertical-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountComparableVerticalBarChart } from "@michi-vz/core";

const chart = mountComparableVerticalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `ComparableVerticalBarChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou expérimentalement `"webgpu"`), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu.

## Notes de comportement

### Deux sous-barres pleine largeur par colonne, ordre d'empilement FIXE

Chaque catégorie dessine `valueBased` (la valeur de référence/antérieure, derrière, éligible au hachurage) et `valueCompared` (la valeur actuelle, devant, pleine), toutes deux au **même x et sur toute la largeur de la colonne** - contrairement à la mise en page "grouped" optionnelle (demi-bande) de ComparableHorizontalBarChart, ce graphique est exclusivement en superposition. L'ordre d'empilement est **fixe** (pas dépendant de la largeur) : `valueBased` est toujours peinte derrière, `valueCompared` toujours devant - porté depuis l'ordre de dessin `BarCompare`/`Bar` du legacy sdg-trade `BarchartVertical`. `colorsBasedMapping` donne à la sous-barre valueBased sa propre couleur par étiquette : associez une teinte claire opaque à `valueBasedOpacity: 1` pour le contraste avant/après le plus net dans les deux thèmes. `valueBasedOpacity` / `valueComparedOpacity` définissent leur opacité de remplissage (aspect historique : 0.45 / 0.9). Une sous-barre dont le remplissage résolu est `transparent` est **ignorée** (les consommateurs cachent une moitié via CSS). `minBarHeight` (5 par défaut) impose un plancher à une barre non nulle pour que les valeurs proches de zéro restent visibles.

### Indicateur de variation - et le contexte de ce graphique le reflète

`deltaIndicator: { show: true }` dessine une flèche de variation + une étiquette formatée AU-DESSUS de la plus haute des deux sous-barres (placement legacy `translate(bandwidth/3, -32)`). Contrairement à ComparableHorizontalBarChart (dont l'indicateur est purement présentationnel), **le `getContext()` de ce graphique reflète l'indicateur** : chaque ligne `series[]` porte `deltaDirection` / `deltaColor` / `deltaLabel` quand il est actif, `stats.improved` / `stats.worsened` compte les évolutions positives/négatives, et le tableau d'accessibilité gagne une cinquième colonne « Change ». `positiveIsGood` / `positiveIsUp` choisissent la correspondance couleur/direction (voir le JSDoc de `DeltaIndicatorConfig` pour la table de décision complète) ; `formatter(diff, datum)` prend le contrôle total du texte de l'étiquette. Absent, ou `{ show: false }`, c'est un no-op prouvable - zéro géométrie, zéro nœud DOM `.mv-delta`, zéro champ de contexte supplémentaire.

### `patternsMapping` - remplissages hachurés / image

`patternsMapping: Record<label, imageSrc>` remplit la sous-barre **valeur de base** avec une image en mosaïque au lieu d'une couleur unie. `createHatchPattern({ color, angle?, spacing?, strokeWidth? })` (exporté depuis `@michi-vz/core` et `@michi-vz/react`) renvoie une URI de données SVG à hachures diagonales pour le cas courant. Le moteur SVG la référence depuis un vrai `<defs><pattern>` ; le moteur canvas la met en mosaïque via `ctx.createPattern` et effectue un nouveau rendu une fois l'image chargée.

### Axe des valeurs (y)

`yAxisDomain: [min, max]` fixe la plage de l'axe des valeurs. `symmetricYDomain` force `[-M, M]` (M = la plus grande valeur absolue) pour que zéro soit centré. `showZeroLineForYAxis` dessine une ligne pleine à y=0 (graphiques divergents) ; `showGrid` bascule les lignes de grille horizontales (désactivées par défaut). `yAxisFormat` formate les étiquettes des graduations ; `ticks` fixe leur nombre approximatif.

### Axe des catégories (x)

Les étiquettes de colonne tiennent à l'horizontale quand il y a de la place ; sinon elles s'inclinent à -45° (ou s'éclaircissent vers un sous-ensemble lisible avec `xAxisMode: "horizontal"`), la même mise en page `chooseAxisMode` qu'utilise VerticalStackBarChart. `xAxisLabelPadding` relève le seuil avant qu'une étiquette pivote ; `xAxisFormat` formate chaque étiquette ; `hideTickLabels` les masque entièrement ; `maxBarWidth` plafonne l'épaisseur de chaque colonne (et centre le tracé) pour qu'une poignée de catégories ne se transforme pas en blocs géants.

### Infobulle

`tooltipFormatter(datum, dataSet, type)` reçoit la colonne survolée, toutes les colonnes, et le `type` de **sous-barre** survolée (`"based" | "compared"`). Elle renvoie une chaîne HTML ; le wrapper React accepte en plus un nœud React (converti en HTML statique). L'infobulle intégrée est consciente des bords (elle bascule près des bords droit/bas).

### Chargement / absence de données + interaction

`isLoading` et `isNodata` pilotent la superposition (React : `isLoadingComponent` / `isNodataComponent`). Survoler met en évidence une colonne (les autres s'estompent) et `mouseleave` la réinitialise ; les barres sont arrondies (rayon 5) avec une bordure de 1px.

> **Autorités de couleur côté consommateur :** le contexte porte `legendData` (`{ label, color, dataLabelSafe }`) pour qu'un système de couleur par injection CSS puisse indexer des règles par étiquette ; `onChartDataProcessed` n'est émis que lorsque le contexte **change** (réémettre un contexte inchangé à chaque rendu peut boucler un consommateur qui déclenche une action à chaque appel).
