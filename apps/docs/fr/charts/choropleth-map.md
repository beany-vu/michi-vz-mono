---
title: Carte choroplèthe
description: "Carte choroplèthe monde/région : votre propre GeoJSON, coloré par une échelle de seuils ou une carte de catégories explicite. 13 projections d3-geo/d3-geo-projection ; SVG, canvas et une couche WebGPU déléguée."
---
# Carte choroplèthe

<span class="vp-badge tip">Géographie</span>

Le premier graphique **géo** de la bibliothèque : colorer une carte du monde ou d'une région selon une valeur. Les données continues (valeur d'export, un indice, une part) pilotent une échelle de couleurs à seuils ; les données catégorielles (une catégorie « dernière année disponible », un statut) pilotent une carte explicite étiquette → couleur. La géographie est **toujours une prop** - ce package n'embarque aucune donnée topologique ; vous importez votre propre GeoJSON monde/région et le transmettez tel quel.

<ChartDemo chart="choropleth-map-chart" :legend="[]" />

Mode catégoriel - `colorsMapping` l'emporte sur `colorScale` (le cas d'usage sdg-trade **Data Availability** : quelques catégories fixes étiquette → couleur, pas un dégradé numérique) :

<ChartDemo chart="choropleth-map-chart" :index="1" :legend="[]" />

::: warning Géographie de démonstration uniquement
L'atlas mondial de cette page est un fichier GeoJSON simplifié du domaine public, fourni avec les exemples de la documentation à titre d'illustration. Frontières, noms et tracés ne font PAS autorité. Vérifiez les frontières et la toponymie de votre propre fichier `geography` selon la politique cartographique de votre organisation avant tout usage en production : la bibliothèque rend le fichier tel quel, sans correction.
:::

> Le graphique ci-dessus est le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Apportez votre propre géographie

`geography` accepte soit une `FeatureCollection` GeoJSON complète, soit un `GeoFeatureItem[]` pré-normalisé (`{ id, geometry, name? }`). Rien concernant les formes n'est embarqué dans `@michi-vz/core` - importez une carte du monde une fois dans votre application et réutilisez-la sur chaque carte choroplèthe :

```ts
import worldJson from "./world.json"; // votre propre FeatureCollection GeoJSON
import { ChoroplethMapChart } from "@michi-vz/react";

<ChoroplethMapChart
  geography={worldJson}
  dataSet={[
    { id: "USA", label: "United States", value: 2450 },
    { id: "DEU", label: "Germany", value: 1870 },
    // ...
  ]}
  colorScale={{ domain: [500, 1000, 2000], range: ["#eaf3fb", "#5b9bd5", "#123a63"] }}
/>
```

L'`id` de chaque feature d'une `FeatureCollection` est lu depuis le `Feature.id` GeoJSON (repli sur `properties.id`) ; `name` depuis `properties.name`. Sources courantes : [world-atlas](https://github.com/topojson/world-atlas) (TopoJSON - convertissez avec `feature()` de `topojson-client`), [Natural Earth](https://www.naturalearthdata.com/), ou un fichier régional maintenu par votre équipe. Les docs/exemples de ce package n'embarquent qu'un petit échantillon illustratif de 12 formes - pas de vraies côtes - pour que la bibliothèque reste libre de toute dépendance à des données topologiques.

## Usage

::: code-group

```tsx [React]
import { ChoroplethMapChart } from "@michi-vz/react";

export default () => <ChoroplethMapChart {...props} />; // props = les options du graphique
```

```vue [Vue]
<script setup>
import { ChoroplethMapChart } from "@michi-vz/vue";
</script>

<template>
  <ChoroplethMapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { choroplethMapChart } from "@michi-vz/svelte";
</script>

<div use:choroplethMapChart={props}></div>
```

```ts [Angular]
// main.ts - enregistrer les éléments une fois
import "@michi-vz/angular";
import { applyChoroplethMapChartProps } from "@michi-vz/angular";

// composant (utilise CUSTOM_ELEMENTS_SCHEMA)
// template : <michi-vz-choropleth-map-chart #c></michi-vz-choropleth-map-chart>
applyChoroplethMapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-choropleth-map-chart id="c"></michi-vz-choropleth-map-chart>
<script>
  Object.assign(document.getElementById("c"), props); // geography, dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountChoroplethMapChart } from "@michi-vz/core";

const chart = mountChoroplethMapChart(el, props);
chart.update(next);
chart.getContext(); // agnostique du moteur de rendu, prêt pour un LLM
chart.destroy();
```

:::

## API

Les props sont typées comme `ChoroplethMapChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou expérimentalement `"webgpu"`), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu.

## Notes de comportement

### Jointure de `dataSet` avec `geography` - `joinBy`

Chaque ligne de `dataSet` (`{ id, label, value?, color? }`) est mise en correspondance avec une feature de géographie via `joinBy` : `"id"` (par défaut) compare `ChoroplethDataItem.id` à `GeoFeatureItem.id` / `Feature.id` GeoJSON - la jointure propre et stable (p. ex. des codes ISO-A3). `"name"` compare `label` à `GeoFeatureItem.name` / `properties.name` à la place, pour des données indexées par nom de pays plutôt que par code. Une feature sans ligne correspondante (ou une ligne dans `disabledItems`) est peinte avec `noDataColor` et son infobulle reçoit la forme de repli `{ id, name }` au lieu de la ligne complète.

### Priorité de résolution des couleurs

`colorsMapping[label]` (catégoriel, explicite) l'emporte sur `colorScale` (continu - un `range` hexadécimal résolu + un `domain` numérique, construit dans un `scaleThreshold` d3 ; les valeurs hors domaine se calent sur la première/dernière couleur du range) qui l'emporte sur la `color` propre à la ligne qui l'emporte sur la palette auto-assignée `colors`. Le cœur reste libre de `d3-scale-chromatic` - passez des couleurs hexadécimales déjà résolues à `colorScale.range`, en les générant depuis un schéma nommé (ou ailleurs) dans votre propre application si vous le souhaitez.

### Projections - les 13, un défaut

`projection` distribue vers `geoEqualEarth`, `geoMercator`, `geoTransverseMercator`, `geoAlbers`, `geoAlbersUsa`, `geoAzimuthalEqualArea`, `geoAzimuthalEquidistant`, `geoOrthographic`, `geoConicConformal`, `geoConicEqualArea`, `geoConicEquidistant`, `geoRobinson` (le défaut), et `geoGilbert` (les deux depuis `d3-geo-projection`). `projectionConfig` (`scale`, `rotate`, `center`, `parallels`) affine la projection choisie ; les champs omis reprennent les défauts du legacy sdg-trade `MapChoropleth` (`rotate: [-18, 0]`, `center: [0, 10]`, une échelle dérivée de la largeur) plutôt que `projection.fitSize` - cela reproduit exactement le résultat visuel de ce graphique plutôt que de recadrer sur un autre cadrage. `geoAlbersUsa` est une projection composite fixe : elle ignore `rotate` / `center` / `parallels`.

### Rendu : SVG, canvas et un WebGPU délégué

`renderer="svg"` (par défaut) dessine un `<path class="region">` par feature. `renderer="canvas"` dessine via `geoPath(projection, ctx)` - d3-geo effectue un rendu natif et efficace directement sur un contexte 2D canvas, donc rien ne reparse la chaîne de chemin SVG ni ne réimplémente les maths de projection. `renderer="webgpu"` **délègue** au même moteur canvas-2D plutôt que de trianguler des polygones arbitraires sur le GPU : les régions réelles sont fréquemment concaves, multi-anneaux, avec des trous (une enclave, un archipel), et une triangulation GPU correcte de polygones simples arbitraires nécessite un véritable ear-clipping - hors de proportion face au rendu 2D natif déjà rapide de d3-geo pour un graphique typiquement de quelques dizaines à quelques centaines de chemins. Il reste conditionné par les capacités (`navigator.gpu`) et rapporte le moteur effectif via `getContext().renderer`, comme tout autre graphique.

### Survol / infobulle

`tooltipFormatter(d)` reçoit le `ChoroplethDataItem` complet pour une région appariée, ou `{ id, name }` pour une région non appariée. En mode canvas/webgpu, le survol est résolu en reprojetant la géométrie brute de chaque feature et en exécutant un test point-dans-polygone (pas une approximation par boîte englobante), donc les frontières irrégulières sont correctement détectées. Le survol estompe toutes les autres régions (le comportement standard `highlightItems` de la maison) plutôt qu'une bordure `:hover` CSS persistante qui s'assombrit - l'effet de survol du graphique legacy.

### Chargement / absence de données

`isLoading` et `isNodata` pilotent la superposition (React : `isLoadingComponent` / `isNodataComponent`), identique à tout autre graphique de la maison.

> **Autorités de couleur côté consommateur :** le contexte porte `legendData` (`{ label, color, dataLabelSafe }`) pour qu'un système de couleur par injection CSS puisse indexer des règles par étiquette ; `onChartDataProcessed` n'est émis que lorsque le contexte **change**.
