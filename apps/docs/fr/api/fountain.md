---
title: API Fontaine (Jet d'Eau)
---

# API Fontaine (Jet d'Eau)

Un chiffre par colonne (le gros point), l'étendue réelle autour (la fontaine, de `low` à `high`) et les mesures elles-mêmes (les petits points), le tout sur un seul axe y. X catégoriel = instantané ; x temporel ou numérique = tendance. Voir la **[démo de la Fontaine](/fr/charts/fountain)** et sa [clé de lecture](/fr/charts/fountain#how-to-read-it).

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/fountain-chart";
// <michi-vz-fountain-chart> est maintenant défini
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
```

```ts [React]
import { FountainChart } from "@michi-vz/react/fountain-chart";
```

```ts [Vue]
import { FountainChart } from "@michi-vz/vue/fountain-chart";
```

```ts [Svelte]
import { fountainChart } from "@michi-vz/svelte/fountain-chart";
```

```ts [Angular]
import { bindChart, applyFountainChartProps } from "@michi-vz/angular/fountain-chart";
// nécessite CUSTOM_ELEMENTS_SCHEMA sur le composant qui héberge <michi-vz-fountain-chart>
```

:::

## Props

<PropsTable chart="fountain-chart" />

::: tip Deux modes, une seule forme de données
Définissez `xAxisDataType: "band"` (ou omettez-le) pour le **mode instantané** : une colonne par `label`. Donnez un `xAxisDataType` temporel ou numérique et une `date` sur chaque élément pour le **mode tendance** : les jets se placent le long de l'axe x et, avec une seule série, une ligne en pointillés relie les gros points. Un élément `forecast: true` a une tige et un contour en pointillés, un remplissage plus clair et un gros point creux, sans petits points.
:::

### Nouveau dans core 1.29 {#new-props}

| Prop | Type | Par défaut | Ce qu'elle fait |
| --- | --- | --- | --- |
| `showRange` | `boolean` | `true` | Dessine la fontaine, l'étendue `[low, high]`. `false` ne dessine que la tige et le gros point ; les petits points disparaissent aussi. |
| `showSamples` | `boolean` | `true` | Dessine un petit point par mesure, quand les éléments ont des `samples`. |
| `showValueLabels` | `boolean` | `true` | Écrit sous chaque étiquette x : « usual 30 » en gras, « &lt;mot bas&gt; 22 », « &lt;mot haut&gt; 55 », « only N &lt;sampleWord&gt; » sous 10 mesures, et pour chaque ligne de référence avec `goodSide` un « 17 of 20 » en gras suivi de son `countLabel`. |
| `drift` | `boolean` | `false` | Le look genevois : le haut de chaque fontaine penche de la même façon. Cela ne porte aucune donnée. |
| `yAxisTitle` | `string` | aucun | Titre écrit verticalement à côté de l'axe y, par exemple « minutes (plus haut = plus lent) ». |
| `endLabels` | `[string, string]` | `["lowest", "highest"]` | Les mots de l'extrémité basse et haute dans les étiquettes et l'infobulle. |
| `referenceLines` | `FountainReferenceLine[]` | aucune | Des lignes en pointillés dans la couleur d'alerte du thème, avec leur étiquette au bout droit. Voir [plus bas](#reference-line). |
| `labels` | `FountainLabels` | anglais | Les autres mots du graphique, pour la traduction. Voir [plus bas](#labels). |
| `readingGuide` | `boolean \| string` | `false` | Une légende sous le graphique, coupée entre ses règles (à chaque « · ») quand elle ne tient pas sur une ligne. `true` affiche celle par défaut, qui ne nomme que les marques dessinées (pas de règle sur les petits points sans petits points, pas de `Tall fountain` sans fontaine) ; une chaîne la remplace. |
| `sampleWord` | `string` | `"measurements"` | Le nom au pluriel des mesures (« jours », « commandes »). Pluriel exprès : il n'y a pas de mise au pluriel automatique. |

`showTrendLine` a maintenant une valeur par défaut selon le mode : `true` en mode tendance avec une seule série ; `false` avec plusieurs séries, où une seule ligne zigzaguerait de l'une à l'autre, et en mode instantané (mettez `true` pour relier une suite ordonnée de catégories).

### Élément de données : `FountainDataItem` {#data-item}

| Champ | Type | Ce que c'est |
| --- | --- | --- |
| `label` | `string` | La colonne (instantané) ou le nom de la série (tendance). Détermine la couleur et l'attribut `data-label`. |
| `code` | `string` | Identifiant stable facultatif, repris dans le contexte ; non affiché. |
| `value` | `number` | Le gros point. Facultatif quand `samples` est fourni : c'est alors leur médiane. Sans valeur finie ni mesures, le jet est ignoré. |
| `low` | `number` | La base de la fontaine. |
| `high` | `number` | Le sommet de la fontaine. |
| `spread` | `number` | Raccourci pour une étendue égale : `low = value - spread`, `high = value + spread`. |
| `samples` | `number[]` | Les mesures réelles, un petit point chacune, à leur hauteur exacte dans la fontaine. |
| `forecast` | `boolean` | Une période prévue : tige et contour en pointillés, remplissage plus clair, gros point creux, ni petits points ni comptes. |
| `color` | `string` | Couleur par élément. Ordre par jet : `colorsMapping[label]`, puis `color`, puis la couleur de la palette du label. |
| `date` | `number \| string` | La position en x en mode tendance ; un élément sans date utilisable y est ignoré. |
| `predicted` | `boolean` | Déprécié : utilisez `forecast`. Toujours pris en compte. |
| `certainty` | `boolean` | Déprécié : `certainty: false` équivaut à `forecast: true`. Toujours pris en compte. |
| `density` | `number` | Déprécié et ignoré (un avertissement `ignored-option`). |
| `lean` | `number` | Déprécié et ignoré (un avertissement `ignored-option`). |

L'étendue vient du premier disponible : `low`/`high`, puis `spread`, puis la plus basse et la plus haute mesure ; sans aucun, le jet n'a pas de fontaine. Une extrémité manquante suit le même ordre. Les mesures hors d'une étendue explicite, et une valeur hors de l'étendue, élargissent l'étendue et envoient un avertissement. Les valeurs négatives sont acceptées : le domaine y inclut 0 et chaque `low`, et la tige descend depuis la ligne de base.

### Ligne de référence : `FountainReferenceLine` {#reference-line}

| Champ | Type | Ce que c'est |
| --- | --- | --- |
| `value` | `number` | La position de la ligne, en unités y. Toujours dans le domaine y automatique. |
| `label` | `string` | Écrit au bout droit de la ligne (sur plusieurs lignes si besoin ; le graphique réserve une marge à droite). |
| `goodSide` | `"below" \| "above"` | Le bon côté. Quand il est défini, chaque jet avec des mesures les compte : « below » compte les mesures à la valeur ou en dessous, « above » celles à la valeur ou au-dessus. |
| `countLabel` | `string` | Les mots après le compte, par exemple « à l'heure », « reçus ». Par défaut « below the line » ou « above the line ». |

### Mots : `FountainLabels` {#labels}

| Champ | Par défaut | Où il apparaît |
| --- | --- | --- |
| `usual` | `"usual"` | Avant la valeur du gros point : « usual 30 ». |
| `of` | `"of"` | Entre un compte et son total : « 17 of 20 ». |
| `only` | `"only"` | Avant un petit nombre de mesures : « only 5 days ». |
| `forecast` | `"forecast"` | Après l'étiquette x d'un jet de prévision et dans son infobulle : « Fri (forecast) ». |

## Jetons de thème {#theme}

Le graphique lit ces propriétés CSS personnalisées sur son élément hôte (ou un ancêtre), avec tous les moteurs de rendu :

| Jeton | Par défaut | Ce qu'il colore |
| --- | --- | --- |
| `--michi-vz-surface` | `#fff` | Le fond sur lequel se trouve le graphique : le fin anneau autour de chaque petit point et l'anneau autour d'un gros point, qui les séparent des marques en dessous. Sur un thème sombre, donnez-lui la couleur de fond de votre page. |
| `--michi-vz-attention` | `#c0392b` | Les lignes de référence, leurs libellés et les comptes sous les colonnes. |
| `--michi-vz-lake` | `#9cc3dd` | La bande à 0 (le lac). |
| `--michi-vz-ink` | `currentColor` | La ligne de tendance, la ligne en gras « usual 30 » et le titre. |
| `--michi-vz-muted` | `#666` | Les autres étiquettes de valeur, le titre de l'axe y, la légende de lecture et les libellés des axes. |
| `--michi-vz-grid` | `lightgray` | Le fin trait au-dessus de la légende de lecture. |
| `--michi-vz-font-family`, `--michi-vz-font-size` | hérité, `12px` | Tous les mots que le graphique affiche. |

Le gros point creux d'une prévision est un anneau sans rien de peint à l'intérieur (les marques en dessous sont découpées) : il reste creux sur n'importe quel fond, sans jeton.

```css
/* Les graphiques d'une page sombre */
.dark .charts {
  --michi-vz-surface: #1b1b1f;
  --michi-vz-ink: #e3e3e3;
  --michi-vz-muted: #a0a0a0;
}
```

## Événements

Le composant web émet ces `CustomEvent`s en bubbling (le moteur expose les mêmes via les callbacks `on*` dans le tableau ci-dessus) :

| Événement | Détail | Se déclenche quand |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | le jet survolé change (son étiquette) |
| `michi-vz:colormapping` | `Record<string, string>` | une correspondance de couleurs est générée |
| `michi-vz:dataprocessed` | `ChartContext` | les données sont (re)traitées |
| `michi-vz:datawarning` | `DataWarning[]` | des avertissements sur les données sont détectés (voir [Avertissements](#warnings)) |

## getContext()

`mountFountainChart(el, props).getContext()` renvoie un **`FountainChartContext`** agnostique du renderer :

- **`mode`** : `"snapshot"` pour un x catégoriel (en bandes), `"trend"` pour un x temporel ou numérique.
- **`xAxis`** : `{ type, domain }`, les étiquettes des colonnes en mode instantané ou `[min, max]` en mode tendance. **`yAxis`** : `{ domain }`.
- **`jets`** : une entrée par jet dessiné (dans l'ordre de x en mode tendance) :

| Champ | Ce que c'est |
| --- | --- |
| `label`, `code`, `color` | L'étiquette du jet, son identifiant facultatif et sa couleur finale. |
| `value` | Le gros point. |
| `low`, `high` | La base et le sommet de la fontaine ; `null` sans étendue. |
| `range` | `high - low` ; `null` sans étendue. |
| `rangeRatio` | `range / \|value\|` : la taille de l'étendue à côté du chiffre. `null` quand la valeur vaut 0 ou sans étendue. |
| `sampleCount` | Nombre de petits points. |
| `referenceCounts` | Un `{ value, goodSide, count, total, countLabel }` par ligne de référence avec `goodSide` ; `[]` pour une prévision ou un jet sans mesures. |
| `predicted` | `true` pour un jet de prévision. |
| `xPosition` | La `date` brute en mode tendance, `null` en mode instantané. |
| `spread` | Déprécié : `(high - low) / 2`, 0 sans étendue. Utilisez `range`. |
| `spreadRatio` | Déprécié : `spread / \|value\|`, 0 si non calculable. Utilisez `rangeRatio`. |
| `upperBound` | Déprécié : `high` (ou la valeur sans étendue). Utilisez `high`. |
| `lean` | Déprécié : toujours `null`. |

- **`stats`** :
  - `jetCount` : nombre de jets dessinés.
  - `tallest` : `{ label, value }` de la plus grande valeur, ou `null`.
  - `widestRange` : `{ label, range }` de l'étendue la plus large, ou `null` si aucun jet n'en a.
  - `frothiest` : déprécié. `{ label, spreadRatio }` du jet au plus grand `rangeRatio`. Utilisez `widestRange` ou `jets[].rangeRatio`.
  - `trendSlope` : pente (moindres carrés) des valeurs par période (mode tendance, une seule série) ; sinon `null`.
  - `valueRange` : `[min, max]` des valeurs, ou `null`.
  - `predictedCount` : nombre de jets de prévision.
- **`legendData`** : chaque étiquette de tout le `dataSet` avec sa couleur, dans l'ordre d'apparition ; les étiquettes désactivées restent, marquées `disabled: true`. En mode tendance, seulement s'il y a plus d'une série.
- **`summary`** : une phrase en mots simples (en anglais), par exemple `Fountain chart "How long is my commute, really?" with 4 jets. Highest usual value: Bus at 40. Widest range: Car, from 22 to 55.`
- **`a11yTable`** : en-têtes `Label`, `Usual`, les deux `endLabels`, `Samples`, et une colonne par ligne de référence avec `goodSide` (titrée par son `countLabel`, cellules comme `"17 of 20"`) ; le mode tendance ajoute `Period` en premier. L'étiquette d'un jet de prévision est suivie de « (forecast) » : sa ligne en mode tendance se lit `["Year 4", "Battery (forecast)", …]`.

Voir [Contexte LLM](/fr/guide/llm-context) pour savoir comment utiliser le contexte dans des prompts et des rapports.

## Avertissements {#warnings}

`onDataWarning` (et l'événement `michi-vz:datawarning`) reçoit des `DataWarning[]`, chacun `{ type, message, label? }`. Le graphique ne redessine jamais les données en silence : chaque correction est signalée.

| `type` | Quand | Ce que fait le graphique |
| --- | --- | --- |
| `non-finite-value` | Un élément n'a ni `value` finie ni mesures, ou certaines mesures ne sont pas finies. | Ignore le jet (il sort aussi des stats), ou retire ces mesures. Une valeur manquante avec des mesures prend leur médiane. |
| `range-excludes-value` | `low`/`high` (ou `spread`) laissent la valeur dehors. | Élargit l'étendue pour inclure la valeur. |
| `sample-outside-range` | Une mesure est hors d'une étendue explicite. | Élargit l'étendue pour l'inclure. |
| `inverted-range` | `low` est au-dessus de `high`, ou `spread` est négatif. | Inverse les extrémités (prend la taille du spread). |
| `missing-date` | Mode tendance, mais l'élément n'a pas de `date` utilisable. | Ignore l'élément (le graphique reste en mode tendance). |
| `duplicate-date` | Deux jets partagent une date en mode tendance. | Les dessine l'un sur l'autre. |
| `duplicate-label` | Une étiquette se répète en mode instantané. | Ses jets partagent une colonne. |
| `out-of-domain` | Une valeur, une extrémité ou une mesure est hors d'un `yAxisDomain` fourni, ou une ligne de référence l'est. | Limite le dessin au graphique ; les petits points et les lignes hors domaine ne sont pas dessinés. |
| `ignored-option` | Une prop retirée est définie, ou un élément a `density` ou `lean`. | L'ignore. |
| `empty-dataset` | Le `dataSet` est vide. | Affiche l'overlay d'absence de données (« No data available », votre `noDataLabel`, ou le vôtre avec `suppressDefaultOverlay`) à la place des axes et des marques. `isNodata: false` dessine les axes vides. |
| `layout-overflow` | Chaque jet a moins de 24 px, ou les étiquettes de valeurs ne tiennent pas (colonnes étroites, étiquettes x inclinées, jets dans une même colonne, ou graphique trop bas pour elles). | Dessine quand même les jets et laisse de côté les étiquettes de valeurs qui ne tiennent pas, les mots des extrémités d'abord. Élargissez le graphique, montrez moins de jets ou regroupez. |

## Dépréciations {#deprecations}

Tout ceci fonctionne encore dans core 1.29 et sera retiré dans une version ultérieure. Voir [Migrer depuis core 1.28](/fr/charts/fountain#migrating).

- **Props, ignorées avec un avertissement `ignored-option` :** `style`, `frothLayers`, `bloomExponent`, `stemFraction`, `showDroplets`, `showMist`. Sur le web component, `fountainStyle` (`fountain-style`).
- **Champs des éléments :** `predicted` et `certainty` sont pris en compte ; utilisez `forecast`. `density` et `lean` sont ignorés avec un avertissement.
- **Champs du contexte :** `jets[].spread`, `jets[].spreadRatio`, `jets[].upperBound` et `jets[].lean` (toujours `null`) ; `stats.frothiest`. Utilisez `range`, `rangeRatio`, `high` et `stats.widestRange`.

## Source

Les props sont typées comme [`FountainChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) dans `@michi-vz/core`.
