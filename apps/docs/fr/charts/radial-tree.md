---
title: Arbre radial
description: "Un cluster()/dendrogramme radial : les feuilles se situent à égale distance du centre, avec des cercles dimensionnés à la fois au niveau du groupe et de la feuille. Densité de labels adaptative (abréger/tronquer/masquer/pivoter) à mesure que le nombre de feuilles augmente, et un titre central optionnel avec retour à la ligne automatique. SVG, canvas et une couche WebGPU déléguée."
---
# Arbre radial

<span class="vp-badge tip">Composition</span>

Graphique n°21 - le dernier nouveau graphique de la migration sdg-trade : un cluster()/dendrogramme radial. Cible de migration pour le legacy sdg-trade **TreeRadial** - les groupes rayonnent depuis un point central, les feuilles de chaque groupe se plaçant sur leur propre rayon radial, chaque feuille atterrissant à la MÊME distance du centre (un véritable dendrogramme - voir les [notes de comportement](#cluster-et-non-tree) ci-dessous).

<ChartDemo chart="radial-tree-chart" :legend="[]" />

Davantage de feuilles font dépasser les seuils adaptatifs de labels - les labels s'abrègent et pivotent radialement, puis disparaissent entièrement une fois l'arbre très dense :

<ChartDemo chart="radial-tree-chart" :index="1" :legend="[]" />

> Le graphique ci-dessus est le **même moteur** dans chaque framework - seul le code d'intégration ci-dessous diffère.

## Une forme qui reflète Treemap

`RadialTreeNode` reflète volontairement la forme de [`TreemapNode`](/fr/charts/treemap) - `label` / `code` / `value` / `color` / `children` - pour la cohérence de l'API entre les deux graphiques hiérarchiques. Le groupe de couleur d'un nœud est le label de son ancêtre DE PREMIER NIVEAU, exactement comme Treemap : une feuille hérite de la couleur de son groupe sauf si elle (ou le groupe) définit sa propre `color`.

```ts
import { RadialTreeChart } from "@michi-vz/react";

<RadialTreeChart
  centerLabel="Total du commerce de marchandises"
  dataSet={[
    {
      label: "Agriculture",
      children: [
        { label: "Café", value: 8 },
        { label: "Thé", value: 5 },
        // ...
      ],
    },
    // ...
  ]}
/>
```

La valeur propre d'un groupe est TOUJOURS la somme de ses enfants (une `value` explicite sur un nœud avec des `children` est ignorée) - vous ne fournissez donc que les valeurs des feuilles.

## Utilisation

::: code-group

```tsx [React]
import { RadialTreeChart } from "@michi-vz/react";

export default () => <RadialTreeChart {...props} />; // props = les options du graphique
```

```vue [Vue]
<script setup>
import { RadialTreeChart } from "@michi-vz/vue";
</script>

<template>
  <RadialTreeChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { radialTreeChart } from "@michi-vz/svelte";
</script>

<div use:radialTreeChart={props}></div>
```

```ts [Angular]
// main.ts - enregistrer les éléments une fois
import "@michi-vz/angular";
import { applyRadialTreeChartProps } from "@michi-vz/angular";

// composant (utilise CUSTOM_ELEMENTS_SCHEMA)
// template : <michi-vz-radial-tree-chart #c></michi-vz-radial-tree-chart>
applyRadialTreeChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-radial-tree-chart id="c"></michi-vz-radial-tree-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountRadialTreeChart } from "@michi-vz/core";

const chart = mountRadialTreeChart(el, props);
chart.update(next);
chart.getContext(); // agnostique du moteur de rendu, prêt pour les LLM
chart.destroy();
```

:::

## API

Les props sont typées `RadialTreeChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Partagées par tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou `"webgpu"` expérimental), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu.

## Notes de comportement

### cluster(), et non tree()

La disposition est construite avec le `cluster()` de d3-hierarchy - vérifié par rapport à l'appel exact du graphique legacy - PAS `tree()`. `cluster()` place chaque FEUILLE à la même distance radiale du centre, quel que soit le nombre de niveaux de sa branche, ce qui en fait un véritable dendrogramme ; `tree()` dimensionnerait au contraire chaque branche selon la profondeur de son propre sous-arbre, et des feuilles à des profondeurs différentes atterriraient à des rayons différents.

### Cercles à double niveau, une seule échelle linéaire

Le cercle du GROUPE (dimensionné par le total du groupe) et chaque cercle de FEUILLE (dimensionné par sa propre valeur) sont dessinés à partir de la MÊME échelle linéaire (vérifiée par rapport au `scaleLinear` du graphique legacy - pas une échelle sqrt) sur le domaine combiné de la valeur de chaque groupe ET de chaque feuille. `radiusRange` (par défaut `[2, 32]`, le `circleRange` legacy) définit la plage de sortie de l'échelle.

### Densité de labels adaptative

Les labels réagissent au nombre total de FEUILLES via `labelDensityThresholds` :

- En dessous de `rotateAbove` (par défaut 20) : chaque nœud affiche son nom complet ; à densité faible à moyenne, le nom d'un groupe de premier niveau se tronque en plus à 10 caractères une fois le nombre passé la moitié de `rotateAbove` (une bizarrerie legacy conservée - les feuilles ne se tronquent jamais ainsi).
- Au-delà de `rotateAbove` : chaque label s'abrège à 3 lettres + "." et pivote radialement au lieu de rester horizontal.
- Au-delà de `hideAbove` (par défaut 100) : aucun label n'est dessiné.

### Retour à la ligne du centerLabel

`centerLabel` (le `titleCenter` legacy) dessine un petit cercle au centre (un quart du rayon extérieur) avec le texte qui revient à la ligne toutes les 10 caractères environ - un portage simplifié et déterministe du retour à la ligne legacy basé sur la largeur des pixels.

### Liens

Chaque nœud dessine un lien courbe (bézier cubique) vers son parent - les « rayons » radiaux du dendrogramme - porté depuis la formule des points de contrôle du graphique legacy. Les liens sont rendus en une seule couche d'arrière-plan, de sorte qu'un lien ne recouvre jamais visuellement un cercle (une simplification documentée, purement esthétique, de l'entrelacement DOM par nœud du legacy).

### Imbrication au-delà de 2 niveaux

Le contrat consommateur est de 2 niveaux (groupe + feuille), mais une imbrication plus profonde est tolérée : chaque niveau supplémentaire obtient tout de même un cercle dimensionné et un lien, `onDataWarning` le signale (`excess-depth`), et les règles de densité de labels s'appliquent toujours (la règle de troncature réservée à la profondeur 1 cesse de s'appliquer en dessous du niveau supérieur).

### Rendu : SVG, canvas et un WebGPU délégué

`renderer="svg"` (par défaut) dessine un `<circle class="radial-tree-node-circle">` par nœud. `renderer="canvas"` peint les mêmes marques sur un canvas 2D, en résolvant la couleur de remplissage via la même sonde CSS consommateur que chaque graphique à marque unique utilise. `renderer="webgpu"` **délègue** au rendu canvas 2D, pour la même raison que Carte choroplèthe / Carte à symboles : les liens du dendrogramme sont des courbes de bézier, donc une tessellation GPU correcte serait disproportionnée ici.

### Chargement / absence de données

`isLoading` et `isNodata` pilotent la surcouche (React : `isLoadingComponent` / `isNodataComponent`), identique à tous les autres graphiques de la maison.

> **Autorités de couleur consommateur :** le contexte porte `legendData` (`{ label, color, dataLabelSafe }`, une ligne par groupe de premier niveau) afin qu'un système de couleur par injection CSS puisse cibler des règles par label ; `onChartDataProcessed` n'est émis que lorsque le contexte **change**.
