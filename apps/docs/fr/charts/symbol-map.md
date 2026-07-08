---
title: Carte à symboles
description: "Une carte à bulles/symboles dont les chevauchements sont résolus par une simulation de force d3-force en une passe : vous fournissez lng/lat par élément. Dot-only par défaut (parité legacy) ; un fond de carte discret optionnel est disponible. SVG, canvas et une couche WebGPU déléguée."
---
# Carte à symboles

<span class="vp-badge tip">Géographie</span>

Graphique n°20 : une carte à bulles dont les chevauchements sont résolus par une simulation de force. Cible de migration pour le legacy sdg-trade **MapSymbolForce** - une carte à bulles dot-only où les coordonnées de chaque élément se projettent sur le plan, puis une simulation de force en une passe écarte juste assez les cercles qui se chevauchent pour rester lisibles, sans les éloigner de leur position réelle. Contrairement à [Carte choroplèthe](/fr/charts/choropleth-map), la géographie est **optionnelle** ici : omettez-la pour l'apparence dot-only du graphique legacy (le défaut), ou fournissez-la pour dessiner un fond de carte discret derrière les symboles.

<ChartDemo chart="symbol-map-chart" :legend="[]" />

Un second anneau concentrique (`valueSecond`) se lit comme une sous-métrique du cercle extérieur - par exemple « dont » un partenaire ou un canal spécifique :

<ChartDemo chart="symbol-map-chart" :index="1" :legend="[]" />

## Positions exactes ou anti-chevauchement

`positionMode` définit ce que signifie la position d'un symbole :

- **`"force"` (défaut, parité héritée)** : la simulation en une passe écarte les cercles qui se chevauchent. Lisible quand beaucoup de symboles se concentrent au même endroit, mais chaque symbole peut dériver de ses coordonnées réelles, et sur un petit graphique la dérive peut être forte.
- **`"precise"`** : chaque symbole reste exactement à son `lng`/`lat` projeté ; les chevauchements sont permis.

Un symbole dessiné sur le mauvais pays est un problème d'exactitude cartographique, et pour certains publics un sujet politiquement sensible. Préférez `"precise"` dès qu'un fond `geography` est visible : une carte invite à lire les positions au pied de la lettre.

<PositionModeDemo labelPrecise="precise : positions exactes" labelForce="force : anti-chevauchement" hint="Passez en force : les bulles dérivent de leurs coordonnées réelles pour résoudre les collisions. Avec un fond de carte visible, precise est en général le choix honnête." />

::: warning Géographie de démonstration uniquement
L'atlas mondial de cette page est un fichier GeoJSON simplifié du domaine public, fourni avec les exemples de la documentation à titre d'illustration. Frontières, noms et tracés ne font PAS autorité. Vérifiez les frontières et la toponymie de votre propre fichier `geography` selon la politique cartographique de votre organisation avant tout usage en production : la bibliothèque rend le fichier tel quel, sans correction.
:::

> Le graphique ci-dessus est le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Apportez vos propres coordonnées

Contrairement au graphique legacy (qui embarquait un CSV statique d'environ 200 lignes de coordonnées de pays), `@michi-vz/core` n'embarque **aucune** table de coordonnées. Chaque élément de `dataSet` fournit son propre `lng`/`lat` :

```ts
import { SymbolMapChart } from "@michi-vz/react";

<SymbolMapChart
  dataSet={[
    { id: "usa", label: "United States", lng: -95.7, lat: 38.9, value: 100 },
    { id: "deu", label: "Germany", lng: 13.4, lat: 52.5, value: 60, valueSecond: 30 },
    // ...
  ]}
/>
```

Comme l'étendue utilisée pour ajuster la disposition dot-only au tracé est dérivée des coordonnées de votre propre jeu de données (et non d'une table monde toujours complète embarquée), le « monde » que le graphique dessine ne s'étend qu'aussi loin que les points que vous fournissez - voir les [notes de comportement](#projection-dot-only-vs-fond-de-carte) ci-dessous.

## Usage

::: code-group

```tsx [React]
import { SymbolMapChart } from "@michi-vz/react";

export default () => <SymbolMapChart {...props} />; // props = les options du graphique
```

```vue [Vue]
<script setup>
import { SymbolMapChart } from "@michi-vz/vue";
</script>

<template>
  <SymbolMapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { symbolMapChart } from "@michi-vz/svelte";
</script>

<div use:symbolMapChart={props}></div>
```

```ts [Angular]
// main.ts - enregistrer les éléments une fois
import "@michi-vz/angular";
import { applySymbolMapChartProps } from "@michi-vz/angular";

// composant (utilise CUSTOM_ELEMENTS_SCHEMA)
// template : <michi-vz-symbol-map-chart #c></michi-vz-symbol-map-chart>
applySymbolMapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-symbol-map-chart id="c"></michi-vz-symbol-map-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountSymbolMapChart } from "@michi-vz/core";

const chart = mountSymbolMapChart(el, props);
chart.update(next);
chart.getContext(); // agnostique du moteur de rendu, prêt pour un LLM
chart.destroy();
```

:::

## API

Les props sont typées comme `SymbolMapChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou expérimentalement `"webgpu"`), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu.

## Notes de comportement

### La résolution de chevauchement en une passe

Le `lng`/`lat` de chaque élément se projette vers une position pixel « réelle » ; `forceX`/`forceY` épinglent la simulation sur cette position exacte comme cible, `forceManyBody()` ajoute une légère séparation, et `forceCollide` (rayon + 2px de marge, 3 itérations) est ce qui écarte réellement les cercles qui se chevauchent. La simulation se stabilise de manière synchrone au MÊME seuil alpha que le graphique legacy (`0.0011`) - déterministe : des entrées identiques se stabilisent toujours sur la même disposition, donc deux montages des mêmes données produisent des positions identiques au pixel près. Deux éléments avec des coordonnées *exactement identiques* démarrent empilés et se séparent proprement une fois la simulation stabilisée.
`positionMode: "precise"` saute entièrement la simulation : chaque symbole reste à sa position projetée exacte et les chevauchements sont permis (voir la démo à bascule plus haut).

### Projection dot-only vs. fond de carte

Sans `geography`, la `projection` choisie (par défaut `"geoMercator"`, comme le graphique legacy) est utilisée **sans réglage** - une simple fabrique de projection sans aucun des réglages translate/scale/rotate/center de [Carte choroplèthe](/fr/charts/choropleth-map) - et l'étendue des points projetés est ensuite redimensionnée pour remplir le tracé, reprenant les mêmes calculs que le graphique legacy. Avec `geography` fourni, c'est la MÊME répartition réglée que Carte choroplèthe qui prend le relais, afin que le fond de carte et les coordonnées des symboles partagent un cadrage géographique cohérent (pas de redimensionnement d'étendue).

### `radiusVisibleMin` - filtré sur la valeur brute

`radiusVisibleMin` masque les éléments dont la valeur **brute** `value` est inférieure ou égale au seuil (et, quand `valueSecond` est défini, dont `valueSecond` est également en dessous) **avant** l'exécution de la disposition de force - repris du propre filtre du graphique legacy, qui comparait la valeur brute, jamais le rayon mis à l'échelle. Le domaine de l'échelle rayon/opacité reste construit à partir de tous les éléments aux coordonnées valides, indépendamment de ce filtre, afin que le rayon d'un symbole reste comparable d'un rendu à l'autre même quand le seuil change.

### L'anneau concentrique secondaire

`valueSecond` dessine un second cercle, de la même couleur que l'extérieur, à `opacity - 0.3` (plafonné à une valeur non négative), dessiné AU-DESSUS du cercle principal - repris exactement de la superposition du `ForceNode` legacy. Quand le second cercle est plus petit que l'extérieur, il se lit comme un noyau plus estompé à l'intérieur d'un anneau plus clair (par ex. « dont ») ; s'il est plus grand, il recouvre entièrement le cercle extérieur.

### Fond de carte optionnel

`geography` (une `FeatureCollection` GeoJSON ou un `GeoFeatureItem[]` pré-normalisé, même contrat que `geography` de Carte choroplèthe) est une **nouvelle** capacité - le graphique legacy n'a jamais dessiné de fond de carte. Omettez-la pour l'apparence dot-only legacy ; fournissez-la pour un fond discret et non interactif (`geographyColor`, par défaut `#eef1f5`) derrière les symboles.

### Rendu : SVG, canvas et un WebGPU délégué

`renderer="svg"` (par défaut) dessine un `<circle class="symbol">` par élément visible (plus un `<circle class="symbol-second">` optionnel). `renderer="canvas"` peint les mêmes marques sur un canvas 2D, en résolvant la couleur de remplissage via la même sonde CSS consommateur que tout graphique à marque unique. `renderer="webgpu"` **délègue** au moteur canvas-2D, même logique que Carte choroplèthe : le fond de carte optionnel est un GeoJSON arbitraire (potentiellement concave, multi-anneaux), donc une tessellation GPU correcte serait disproportionnée ici.

### Chargement / absence de données

`isLoading` et `isNodata` pilotent la superposition (React : `isLoadingComponent` / `isNodataComponent`), identique à tout autre graphique de la maison.

> **Autorités de couleur côté consommateur :** le contexte porte `legendData` (`{ label, color, dataLabelSafe }`) pour qu'un système de couleur par injection CSS puisse indexer des règles par étiquette ; `onChartDataProcessed` n'est émis que lorsque le contexte **change**.
