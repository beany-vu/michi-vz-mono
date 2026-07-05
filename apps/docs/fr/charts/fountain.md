---
title: Fontaine (Jet d'Eau)
description: "Graphique Fontaine (Jet d'Eau), le graphique signature de michi-vz inspiré de la fontaine de Genève : un graphique avec des modes instantané et tendance. Expérimental."
---
# Fontaine (Jet d'Eau)

<span class="vp-badge warning">Expérimental</span> <span class="vp-badge tip">Comparaison</span>

::: warning Expérimental - pas encore stable
Contrairement aux 16 autres graphiques (qui sont stables), le graphique Fontaine est **expérimental** : son API, ses visuels, et la forme de son `ChartContext` peuvent changer dans les futures versions. C'est une marque de narration / communication, pas un outil d'analyse de précision - voir [Quand la Fontaine trouve sa place](#quand-la-fontaine-trouve-sa-place). Épinglez une version si vous en dépendez.
:::

Genève pompe 500 litres par seconde vers le ciel. Vous photographiez le jet. Vous ne photographiez jamais les tonnes d'eau retombant sans être vues - l'embrun dont la colonne est réellement faite. **La plupart des chiffres sont ainsi faits : un pic visible et éclatant, reposant sur une masse cachée que personne ne crédite.** Le graphique Fontaine dessine les deux à la fois - le chiffre phare que vous rapportez, et ce qui l'érode discrètement (ou le soutient).

- **Le sommet du jet est le chiffre** - lisez-le sur l'axe des y, avec précision. C'est le canal le plus puissant dont dispose un graphique.
- **L'embrun est un signal, pas une règle graduée** - « celui-ci saigne / celui-ci est fragile ». Le chiffre secondaire *exact* vit dans l'infobulle et dans `getContext()` (`spreadRatio`), jamais mesuré sur la largeur du panache.

C'est donc un graphique honnête de **narration et d'attribution** : chiffre d'affaires enregistré vs chiffre d'affaires qui fuit, ventes sécurisées vs pertes, les étoiles que vous voyez vs les mainteneurs que vous ne voyez pas. Ce n'est pas un outil d'analyse de précision - pour cela, tournez-vous vers [Éventail](/fr/charts/fan) (bandes d'incertitude), [Barres empilées verticales](/fr/charts/vertical-stack-bar) (sécurisé + à risque triable), ou un waterfall. Voir [Quand la Fontaine trouve sa place](#quand-la-fontaine-trouve-sa-place).

Le `style: "jet"` par défaut est le Jet d'Eau fidèle : une colonne haute et étroite, dense à la base, s'effilochant en une couronne douce qui dérive sous le vent. Un `style: "plume"` plus symétrique (une colonne droite avec une éclosion plumeuse et une jupe de brume) est aussi disponible - voir [Deux silhouettes](#deux-silhouettes).

<ChartDemo chart="fountain-chart" :legend="false" />

> Un graphique, deux modes - décidés par le type de l'axe des x. Définissez `xAxisDataType: "band"` pour le **mode Instantané** : un jet par catégorie, comparant les magnitudes côte à côte (fontaines, villes, produits). Utilisez un x temporel ou numérique (`"date_annual"`, `"date_monthly"`, `"number"`) pour le **mode Tendance** : un jet par période, les sommets montants tracent la tendance tandis que chaque panache montre la volatilité de cette période, et un jet de prévision s'affiche en pointillés avec une couronne plus large et plus mousseuse.

## Données volumineuses sur WebGPU <span class="vp-badge warning">Expérimental</span>

<script setup>
function makeFountain() {
  const dataSet = [];
  for (let i = 0; i < 400; i++) {
    const base = 40 + 60 * Math.sin(i / 11) + 20 * Math.sin(i / 3.3);
    const value = Math.max(5, Math.round(base + (i % 7) * 2));
    const spread = Math.max(1, Math.round(4 + 18 * Math.abs(Math.sin(i / 5)) + (i % 5)));
    const density = Math.min(1, 0.15 + (spread / 40));
    dataSet.push({
      label: `Jet ${i + 1}`,
      value,
      spread,
      density,
      ...(i % 47 === 0 ? { color: "#D4AF37" } : {}),
    });
  }
  return { dataSet, xAxisDataType: "band" };
}
</script>

FountainChart dispose d'un `renderer="webgpu"` optionnel qui peint la colonne et le panache effiloché de chaque jet comme des marques instanciées sur le GPU tandis que les axes, étiquettes et infobulles restent sur la couche SVG. C'est conditionné par les capacités du navigateur : sur un navigateur sans WebGPU, il rétrograde automatiquement vers canvas, et `getContext().renderer` indique lequel a effectivement peint.

<WebgpuHeavyDemo element="michi-vz-fountain-chart" :make="makeFountain" caption="400 jets" />

## Usage

::: code-group

```tsx [React]
import { FountainChart } from "@michi-vz/react";

export default () => <FountainChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { FountainChart } from "@michi-vz/vue";
</script>

<template>
  <FountainChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { fountainChart } from "@michi-vz/svelte";
</script>

<div use:fountainChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyFountainChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-fountain-chart #c></michi-vz-fountain-chart>
applyFountainChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, …
</script>
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Mode Instantané (x catégoriel)

Passez `xAxisDataType: "band"` (ou omettez-le ; "band" est la valeur par défaut). Chaque élément de `dataSet` devient un jet, placé dans sa propre bande x. C'est le mode comparaison : les hauteurs répondent à « lequel est le plus grand ? » et les largeurs de panache répondent à « lequel est le plus incertain ? »

```ts
const props = {
  xAxisDataType: "band",
  dataSet: [
    { label: "Jet d'Eau",    value: 140, spread: 20 },
    { label: "King Fahd",    value: 312, spread: 35 },
    { label: "World Cup",    value: 185, spread: 15 },
    { label: "Bellagio",     value:  84, spread:  8 },
  ],
};
```

## Mode Tendance (x temporel ou numérique)

Fournissez un `xAxisDataType` temporel ou numérique et associez une `date` à chaque élément. Les jets sont disposés le long de l'axe temporel ; une ligne de tendance relie leurs sommets. Un élément `predicted: true` s'affiche en pointillés avec un panache visiblement plus mousseux - l'aspect prévision.

```ts
const props = {
  xAxisDataType: "date_annual",
  dataSet: [
    { label: "2020", date: 2020, value: 42, spread:  5 },
    { label: "2021", date: 2021, value: 51, spread:  6 },
    { label: "2022", date: 2022, value: 63, spread:  8 },
    { label: "2023", date: 2023, value: 70, spread: 10 },
    { label: "2024", date: 2024, value: 78, spread: 14, predicted: true },
    { label: "2025", date: 2025, value: 85, spread: 20, predicted: true },
  ],
};
```

::: warning Idéal pour 5 à 12 périodes en mode tendance
Avec beaucoup de points de données, les jets se compressent et le graphique se lit comme un graphique en courbes décoré - le détail du panache est perdu. Pour les séries temporelles denses (20+ périodes), préférez le [graphique en éventail](/fr/charts/fan) qui encode l'incertitude sous forme de bandes de confiance lisses. La Fontaine brille à échelle humaine : une poignée de périodes où chaque panache peut respirer.
:::

## Deux silhouettes

Définissez `style` pour choisir la forme ; les deux encodent les mêmes données (sommet = `value`, canal de dispersion = `spread`).

- **`style: "jet"` (par défaut)** - le Jet d'Eau fidèle : une colonne haute et étroite, dense et opaque à la base, **s'effilochant en une couronne douce et translucide** au sommet (construite à partir de couches d'opacité graduée ; la largeur de la couronne croît avec `spread`, le nombre de couches avec le `density` optionnel). `lean` (dans [-1, 1]) fait **dériver la couronne sous le vent**. Iconique ; idéal comme titre / indicateur clé ou pour une comparaison.
- **`style: "plume"`** - une colonne symétrique s'épanouissant en une couronne plumeuse : `frothLayers` tranches d'opacité graduée au sommet, une jupe `showMist` douce, et des arcs balistiques `showDroplets`. `stemFraction` et `bloomExponent` ajustent le profil colonne-vers-couronne. Plus épuré pour un indicateur clé unique où la dispersion se lit comme un halo de confiance.

```ts
const props = { style: "plume", dataSet: [{ label: "Q4", value: 78, spread: 20 }] };
```

Les deux styles partagent `stemFraction` (demi-largeur de la base de la colonne en fraction de l'emplacement), le champ `density`, et `lean`. Les couleurs suivent vos données / `colorsMapping` ; l'écume/l'embrun ne module que l'opacité de votre teinte, pour que le graphique s'adapte aux thèmes clair et sombre.

## Quand la Fontaine trouve sa place

Nous avons vérifié la littérature avant de publier ceci. La métaphore du Jet d'Eau est nouvelle en dataviz (aucun graphique fontaine/jet préexistant), et l'idée sous-jacente est une réorientation solide de la famille raincloud / violin / density-strip. Mais sa fonction honnête est la **communication, pas la mesure** - alors utilisez-la là où un titre mémorable accompagné de sa moitié cachée compte, et tournez-vous vers un graphique de précision quand vous devez comparer le second chiffre exactement.

**Bons usages**

- **Titre phare vs érosion cachée.** Chiffre d'affaires enregistré vs qui fuit (l'écart de rétention brut-à-net), ventes sécurisées vs pertes, capacité vs pertes. Une seule marque dit « voici le chiffre, et voici ce qui saigne en dessous ». C'est son usage phare.
- **Élevé mais fragile / poussé artificiellement haut.** Une barre montre le niveau ; l'embrun ajoute « et voici à quel point c'est fragile ».
- **Narration « ce que vous voyez vs ce que ça a coûté »** - la victoire visible et le travail invisible derrière. Elle l'emporte sur la reconnaissance et le rappel (la seule chose que la recherche sur l'embellissement confirme).

**Utilisez-la honnêtement**

- **Le sommet est la seule chose que les lecteurs mesurent.** Placez-y le chiffre phare, sur un véritable axe des y étiqueté. La largeur et l'aire sont des canaux à faible précision (les gens les sous-estiment), donc ne demandez jamais à personne de comparer des largeurs d'embrun.
- **L'embrun est un signal ; le chiffre est du texte.** Faites apparaître le second chiffre exact dans l'infobulle / la légende / `getContext().jets[].spreadRatio`, et ancrez-le dans un seuil déclaré (pertes > 2 %, NRR < 100 %, eau non génératrice de revenus > 20 %, P10-P90).
- **Privilégiez le mode instantané** ; limitez le mode tendance à une poignée de périodes. Pour un travail d'incertitude dense ou précis, préférez [Éventail](/fr/charts/fan) (bandes), [Barres empilées verticales](/fr/charts/vertical-stack-bar) (sécurisé + à risque triable), ou un waterfall.
- Limitez-vous à **5-12 glyphes** et triez les instantanés par `spreadRatio` pour que l'élément le plus mousseux soit facile à trouver.

## API

Les props sont typées comme `FountainChartProps` dans [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Communes à tous les graphiques : `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, ou expérimentalement `"webgpu"`), `highlightItems`, `disabledItems`, et les callbacks `on*`. `onChartDataProcessed` / `getContext()` renvoient le [ChartContext](/fr/guide/llm-context) agnostique du moteur de rendu. Référence complète : [API Fountain](/fr/api/fountain).
