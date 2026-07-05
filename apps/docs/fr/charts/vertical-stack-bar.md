---
title: Barres empilées verticales
description: "Graphique en barres empilées verticales pour la composition entre catégories, avec un garde-fou explicite qui signale les segments manquants au lieu de les aplatir à zéro."
---
# Barres empilées verticales

<span class="vp-badge tip">Composition</span>

« De quoi chaque catégorie est-elle composée, et comment la répartition évolue-t-elle entre elles ? » Empilez les parties dans une barre par catégorie et la composition se lit en un coup d'œil. Quand un segment est manquant, un garde-fou explicite signale le trou au lieu de l'aplatir silencieusement à zéro.

<ChartDemo chart="vertical-stack-bar-chart" />

Besoin de comparer deux choses côte à côte ? Passez **plus d'une série** dans `dataSet` et les barres se **groupent** : par catégorie x, vous obtenez une barre empilée par série, regroupées ensemble. Ici, deux régions sur trois ans, chaque barre divisée en cinq lignes de produits - vous lisez ainsi quelle région est la plus grosse *et* comment sa composition diffère, en même temps :

<ChartDemo chart="vertical-stack-bar-chart" :index="1" />

> Le graphique ci-dessus utilise le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeVsb() {
  const keys = ["Cloud", "Hardware", "Licenses", "Services", "Support"];
  const base = { Cloud: 40, Hardware: 60, Licenses: 50, Services: 30, Support: 20 };
  const drift = { Cloud: 3.2, Hardware: -0.4, Licenses: 0.6, Services: 1.8, Support: 0.3 };
  const series = [];
  for (let i = 0; i < 150; i++) {
    const row = { date: String(2000 + i) };
    for (const k of keys) {
      const noise = (Math.random() - 0.5) * 8;
      row[k] = Math.max(1, base[k] + drift[k] * i * 0.1 + noise);
    }
    series.push(row);
  }
  const dataSet = [
    {
      seriesKey: "Global",
      seriesKeyAbbreviation: "GLB",
      series,
    },
  ];
  return { dataSet, keys, keysOrder: "bottomToTop" };
}
</script>

VerticalStackBarChart possède un `renderer="webgpu"` optionnel qui dessine ses barres sur le GPU tandis que les axes, les libellés et les infobulles restent sur la couche SVG. Il est conditionné aux capacités du navigateur : sur un navigateur sans WebGPU, il bascule automatiquement sur canvas, et `getContext().renderer` indique lequel a effectivement dessiné.

<WebgpuHeavyDemo legend element="michi-vz-vertical-stack-bar-chart" :make="makeVsb" caption="~150 bars × 5 keys" />

## Utilisation

::: code-group

```tsx [React]
import { VerticalStackBarChart } from "@michi-vz/react";

export default () => <VerticalStackBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { VerticalStackBarChart } from "@michi-vz/vue";
</script>

<template>
  <VerticalStackBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { verticalStackBarChart } from "@michi-vz/svelte";
</script>

<div use:verticalStackBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyVerticalStackBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-vertical-stack-bar-chart #c></michi-vz-vertical-stack-bar-chart>
applyVerticalStackBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-vertical-stack-bar-chart id="c"></michi-vz-vertical-stack-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountVerticalStackBarChart } from "@michi-vz/core";

const chart = mountVerticalStackBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Les props sont typées comme `VerticalStackBarChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) indépendant du moteur de rendu.

## Notes de comportement

Ces comportements sont automatiques (aucun câblage supplémentaire) et correspondent au graphique historique `michi-vz` pour une parité prête à l'emploi.

### Axe x dense - rotation / éclaircissement automatique

L'axe à bandes mesure ses libellés et s'adapte : **horizontal** quand ils tiennent, **incliné à −45°** (tous les libellés restent affichés) quand ce n'est pas le cas, et **éclairci** vers un sous-ensemble régulièrement espacé uniquement en cas de densité extrême. La marge inférieure est réservée automatiquement pour que les libellés inclinés ne soient jamais tronqués. Aucune prop nécessaire - passez `xAxisFormat` pour formater le texte des graduations (par ex. `202401` → `01-2024`).

### `date` accepte les nombres

Le `date` d'une ligne peut être un `number` (par ex. `date: 2024`) ou une chaîne ; le moteur le convertit avec `String()`. L'échelle à bandes est `scaleBand<string>`, donc les types mixtes sont normalisés de façon cohérente.

### `keysOrder` et l'ordre des couleurs

`keysOrder` (`"topToBottom"` par défaut | `"bottomToTop"`) choisit à quelle extrémité de la pile se trouve `keys[0]`. Avec `"bottomToTop"`, l'**ordre de la légende / des couleurs est inversé** par rapport à l'ordre de dessin de la pile - une autorité de couleur côté consommateur qui assigne les couleurs selon l'ordre d'apparition dans `legendData` associe donc le slot 0 à la clé du *haut*, pas à celle du bas. L'ordre de dessin (pixel) de la pile est décidé indépendamment et n'est pas affecté.

### `filter` - groupes Top/Bottom-N

`filter = { limit, sortingDir }` classe les **DataSets** (groupes) selon leur total général sur toutes les lignes + clés et conserve les `limit` premiers (`"desc"`) ou derniers (`"asc"`). Tout ce qui en découle (clés, dates, domaine y, barres et légende) dérive de l'ensemble filtré, si bien que la légende reflète toujours exactement les barres dessinées.

### `disabledItems`

Les noms présents dans `disabledItems` suppriment les **clés de segment** correspondantes *et* les groupes **DataSet** correspondants. Désactiver un groupe fait **s'élargir** les barres restantes pour répartir la bande entre les groupes visibles.

### `tooltipFormatter`

Reçoit `{ item, key, seriesKey, series, isMissing }` - `item` est la ligne de données complète, `key` le segment survolé, `series` les lignes du segment survolé à travers les dates. L'infobulle intégrée est **consciente des bords** : elle bascule à gauche du curseur près du bord droit et descend sous le curseur près du haut, afin de ne jamais déborder de l'écran.

### Interaction (canvas)

Survoler un segment estompe les autres **dans la même image** (sans latence de saisie) ; quitter le graphique efface l'estompage. **Cliquez** sur une barre pour épingler l'infobulle, cliquez à nouveau pour la ré-épingler, et cliquez en dehors du graphique pour la désépingler.
