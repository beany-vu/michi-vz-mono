# Installation

`@michi-vz` est publié sur npm sous le scope [**@michi-vz**](https://www.npmjs.com/org/michi-vz). Installez le seul package correspondant à votre stack - les wrappers de framework embarquent automatiquement le moteur (`@michi-vz/core`). Chaque nom de package ci-dessous renvoie vers sa page npm.

| Stack | Package | Dépendances peer |
| --- | --- | --- |
| React | [`@michi-vz/react`](https://www.npmjs.com/package/@michi-vz/react) | `react` & `react-dom` >= 18 |
| Vue | [`@michi-vz/vue`](https://www.npmjs.com/package/@michi-vz/vue) | `vue` >= 3 |
| Svelte | [`@michi-vz/svelte`](https://www.npmjs.com/package/@michi-vz/svelte) | `svelte` >= 4 |
| Angular | [`@michi-vz/angular`](https://www.npmjs.com/package/@michi-vz/angular) | `@angular/core` >= 16 |
| Web component | [`@michi-vz/wc`](https://www.npmjs.com/package/@michi-vz/wc) | aucune (autonome) |
| Vanilla / moteur | [`@michi-vz/core`](https://www.npmjs.com/package/@michi-vz/core) | aucune (d3 est embarqué) |

## Installer

::: code-group

```bash [React]
npm i @michi-vz/react
```

```bash [Vue]
npm i @michi-vz/vue
```

```bash [Svelte]
npm i @michi-vz/svelte
```

```bash [Angular]
npm i @michi-vz/angular
```

```bash [Web component]
npm i @michi-vz/wc
```

```bash [Vanilla JS]
npm i @michi-vz/core
```

:::

> Les exemples utilisent **npm** ; `pnpm add`, `yarn add` et `bun add` fonctionnent de manière identique.

## Dépendances peer

Les wrappers de framework déclarent leur framework comme **dépendance peer** - installez-la (ou assurez-vous que votre application l'a déjà) aux côtés du wrapper, afin de contrôler vous-même la version :

::: code-group

```bash [React]
npm i @michi-vz/react react react-dom
```

```bash [Vue]
npm i @michi-vz/vue vue
```

```bash [Svelte]
npm i @michi-vz/svelte svelte
```

```bash [Angular]
npm i @michi-vz/angular @angular/core
```

:::

`@michi-vz/wc` et `@michi-vz/core` n'ont **aucune dépendance peer** - tout ce dont ils ont besoin (d3-scale/d3-shape, DOMPurify) est embarqué.

## CDN / sans build

Pour un prototype, un CodePen, ou une simple page HTML, chargez les web components directement depuis un CDN - aucun bundler requis :

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [{ date: 2016, value: 10, certainty: true }] },
  ];
</script>
```

> Fixez une version majeure pour la stabilité, par exemple `@michi-vz/wc@1`. Le bundle CDN embarque **tous** les éléments, donc en production préférez installer le package et n'importer que les graphiques que vous utilisez (les sous-chemins par élément sont tree-shakeable).

## Styles

Le moteur injecte automatiquement un minuscule `core.css` (mise en page, infobulle, transitions) au premier montage d'un graphique - **vous n'importez aucun CSS**. Il ne définit délibérément **aucun `fill`/`stroke`** : la couleur est votre contrat. Colorez les marques via leur libellé assaini dans votre propre feuille de style :

```css
.line[data-label-safe="North"] { stroke: #b23a2e; }
.bar[data-label-safe="Africa"] { fill: #cda14a; }
```

Parce que les graphiques se rendent en **light DOM**, votre CSS atteint chaque marque - y compris les pixels du canvas, via une sonde `getComputedStyle`.

## Prochaines étapes

- **[Afficher votre premier graphique](/fr/guide/getting-started)** - le guide de démarrage rapide par framework.
- **[Parcourir les graphiques](/fr/charts/)** - 16 exemples, une page chacun.
- **[Référence API](/fr/api/line)** - props, événements et `getContext()` pour chaque graphique.
- **[Contexte LLM](/fr/guide/llm-context)** - le `ChartContext` agnostique du moteur de rendu que chaque graphique émet.
