---
title: DevTools - inspecter, piloter et éditer n'importe quel graphique
---

# Voir à l'intérieur de vos graphiques

Un graphique dessine des pixels, mais les bugs vivent dans **l'état qui se trouve derrière** :
les données qui ont réellement atteint le moteur, les domaines des axes, la boîte hôte contre
laquelle le graphique a été mesuré, et quels points sont *observés* par opposition à
*prévus*. `@michi-vz/devtools` est un panneau intégré à la page, opt-in, qui expose tout cela
pour **chaque** graphique michi-vz de la page. Aucune extension de navigateur à installer :
c'est un simple import, versionné avec votre application.

<DevtoolsDemo />

> Cliquez sur **Mount devtools** : le blason Michi flottant apparaît en bas à droite - le
> visage replié des devtools. Cliquez dessus (ou appuyez sur `Ctrl/Cmd+Shift+M`) pour ouvrir le
> panneau, choisissez le graphique dans la liste, et parcourez les onglets : **Overview**
> (contexte, séries, édition en direct), **Sizing**, **Scales**, **Diff**, **Hit-test**,
> **Profiler**, **A11y**, et **Insights** - où ✦ **Narrate** et ✦ **Detect anomalies**
> exécutent de vrais plugins `@michi-vz/insights` sur le graphique en direct (le pic de coût de
> 2022 est signalé ; mettez-le en évidence depuis le résultat). C'est le vrai package, qui
> s'exécute dans votre navigateur.

## Démarrage rapide

```bash
npm i -D @michi-vz/devtools
```

```ts
import { mountDevtools } from "@michi-vz/devtools";

// Call this BEFORE mounting charts so they register themselves.
// The floating Michi shield button appears; click it (or Ctrl/Cmd+Shift+M) to open the panel.
const devtools = mountDevtools();

import { mountLineChart } from "@michi-vz/core";
mountLineChart(host, { dataSet, xAxisDataType: "number" });

// later
devtools.destroy();
```

Vous utilisez React ? Il existe une ligne unique qui monte les devtools tant qu'il est dans
l'arbre et ne rend rien (dev-only par défaut - les builds de production suppriment
entièrement le chunk des devtools) :

```tsx
import { MichiVzDevtools } from "@michi-vz/react";

<MichiVzDevtools />
```

Pour Vue, Svelte, Angular, ou les web components natifs, la recette est la même en trois
lignes : appelez `mountDevtools()` dans le hook de montage de votre composant racine,
`destroy()` au démontage. Et pour les builds où les devtools doivent rester inertes sans
changer le point d'import, l'entrée `@michi-vz/devtools/production` exporte un `mountDevtools`
sans effet.

## Le bouton flottant

Monter les devtools ne recouvre jamais votre application : il démarre sous la forme du petit
**blason Michi** (l'emblème de la bibliothèque) dans un coin.
Cliquez dessus pour ouvrir le panneau, fermez le panneau pour récupérer le bouton, et l'état
ouvert/fermé est **mémorisé par navigateur** - rechargez la page et les devtools reviennent
exactement comme vous les aviez laissés. Un coin partagé avec un widget de chat ou un autre
bouton de devtools ? **Faites glisser le blason n'importe où** - cet emplacement est aussi
mémorisé. `buttonPosition` choisit le coin de départ.

`mountDevtools(options?)` renvoie un handle :
`{ open, close, toggle, isOpen, refresh, getRoot, destroy }`.

| Option           | Par défaut         | Remarques                                                                    |
| ---------------- | ------------------ | ------------------------------------------------------------------------ |
| `container`      | `document.body`    | Où l'hôte shadow du panneau est attaché.                               |
| `open`           | mémorisé         | Force `true`/`false` ; par défaut restaure le dernier état, fermé au premier lancement. |
| `hotkey`         | `Ctrl/Cmd+Shift+M` | Définissez `null` pour désactiver le raccourci clavier.                                       |
| `theme`          | `"auto"`           | `"auto"` suit `prefers-color-scheme` ; ou forcez `"dark"` / `"light"`.  |
| `buttonPosition` | `"bottom-right"`   | Coin de départ du bouton ; un emplacement glissé l'emporte lors des montages ultérieurs.     |

Le panneau se rend dans son propre **Shadow DOM**, de sorte que ses styles ne peuvent pas
fuiter dans votre application (et le CSS de votre application ne peut pas casser le panneau).
Les graphiques eux-mêmes restent en light DOM - le panneau ne touche jamais au contrat de
couleur.

Vous travaillez avec un gros contexte ou un long tableau de séries ? **Faites glisser le coin
supérieur gauche du panneau** pour le redimensionner (la taille est mémorisée par navigateur),
ou cliquez sur le bouton **⛶** dans l'en-tête pour l'agrandir à la totalité de la fenêtre et
revenir en arrière.

Les tableaux de bord avec de nombreux graphiques restent gérables : la liste des graphiques a
une **zone de filtre**, chaque entrée de liste a un bouton **◎ locate** qui fait défiler jusqu'à
ce que le graphique soit visible et fait clignoter un contour autour de lui, et au-delà de 8
graphiques le panneau regroupe les rafales de mises à jour en un seul nouveau rendu afin
qu'une page chargée ne ralentisse jamais parce que les devtools sont ouverts. Le panneau ne
fait aucun polling du tout - il ne réagit qu'aux événements du hook, et les instantanés
d'historique ignorent les graphiques dont le contexte n'a pas changé.

## Les onglets

### Sizing - « pourquoi mon graphique est-il invisible / déborde-t-il ? »

Le bug de graphique le plus courant, toutes bibliothèques confondues, est un bug de
dimensionnement : un hôte mesuré à `0×0` à l'intérieur d'un onglet masqué, ou un graphique
dimensionné à partir de `clientWidth` sans soustraire le padding (oui, `clientWidth`
**inclut** le padding) si bien qu'il déborde de sa carte. L'onglet Sizing montre le rectangle
rendu de l'hôte, sa boîte client, et son padding à côté de la largeur/hauteur demandée au
graphique, signale l'écart en langage clair, et inclut une recette `ResizeObserver` prête à
copier-coller - parce que les graphiques michi-vz sont de taille fixe par conception et que la
réactivité appartient à l'hôte.

### Scales - « pourquoi mes valeurs d'axe sont-elles fausses ? »

Affiche les domaines `xAxis` / `yAxis` en direct, directement depuis le `ChartContext`, avec
des vérifications de cohérence pour les trois modes de défaillance classiques : un domaine
`NaN` (une date ou une valeur n'a pas pu être analysée), un domaine de largeur nulle (toutes
les valeurs identiques, les marques s'effondrent), et un domaine inversé (une prop de domaine
manuelle passée à l'envers). Les graphiques sans axes (pie, sankey, treemap) le signalent au
lieu de n'afficher rien.

### Diff - « qu'est-ce qui a changé entre ces deux rendus ? »

Le panneau prend un instantané du `ChartContext` de chaque graphique à **chaque mise à jour**
et conserve un court historique. L'onglet Diff compare en profondeur les deux derniers
instantanés en une liste d'ajouts/suppressions/changements avec des chemins exacts
(`series[0].max: 140 → 555`), si bien que « mon graphique a l'air différent et je ne sais pas
pourquoi » devient une réponse en deux lignes. Reculez dans la barre d'historique et le diff
suit l'instantané que vous consultez.

### Insights - le graphique s'explique lui-même

Chaque graphique michi-vz porte déjà un `summary` en langage clair dans son contexte - le même
texte que consomme un agent IA ou un pipeline de lecteur d'écran. L'onglet Insights l'affiche
dans une bulle au style IA, et quand [`@michi-vz/insights`](/fr/guide/insights) est attaché au
graphique, il fait apparaître des actions en un clic découvertes via `getTools()` :

- ✦ **Narrate** - `chart.use(narrate())` - narration en prose déterministe de l'état actuel.
- ✦ **Detect anomalies** - `chart.use(anomaly())` - signale les valeurs aberrantes par série ;
  le résultat propose une **mise en évidence** en un clic de la série signalée sur le graphique
  en direct.
- ✦ **Forecast** - `chart.use(forecast())` - les points projetés, la précision, et tout
  franchissement de seuil.

Tout ce qu'un plugin expose d'autre s'affiche sous **Advanced** comme un exécuteur d'outil brut
(arguments JSON en entrée, résultat JSON en sortie).

### Hit-test - « pourquoi mon infobulle ne se déclenche-t-elle pas ? »

Les marques en canvas n'ont pas de DOM, donc quand un survol cesse de fonctionner, il n'y a
rien à inspecter dans le panneau Elements - vous ne pouvez pas distinguer un bug de test de
collision (hit-test) d'un écouteur mort ou d'un problème CSS `pointer-events`. L'onglet
Hit-test diffuse en direct les résultats des propres tests de collision en canvas du
graphique : chaque déplacement de pointeur journalise ses coordonnées et la marque qu'il a
résolue (ou un échec), et un marqueur vert/rouge suit le dernier événement sur le graphique
lui-même. Le diagnostic décisif est le silence : si vous survolez et que le journal ne bouge
pas, l'écouteur canvas du graphique est mort.

### Profiler - « pourquoi est-ce devenu lent ? »

Chaque `update()` est chronométré à la frontière du moteur. L'onglet Profiler montre les
durées de rendu dernière/moyenne/max avec une bande de barres par mise à jour, et avertit
quand le temps de rendu tend à augmenter - les suspects habituels étant des données
croissantes, des props non mémoïsées forçant des rendus complets, ou des écouteurs qui
fuient.

### A11y - l'audit qu'aucun devtool de graphique ne fait

Des heuristiques inspirées de Chartability s'exécutent sur le contexte en direct : un
`summary` en langage clair manquant (les lecteurs d'écran et les agents IA n'obtiennent
rien), un tableau a11y avec moins de lignes que de séries, deux séries partageant une même
couleur (indiscernables sans la vue), et des couleurs de série en dessous du ratio de
contraste graphique de 3:1 sur un fond clair ou sombre. Sous l'audit, l'onglet affiche le
véritable tableau de données a11y - exactement ce qu'obtient un lecteur d'écran.

### Overview - inspecter, piloter, éditer

L'inspecteur classique : le résumé, les statistiques par série (y compris la répartition
réel-contre-prédit ci-dessous), des bascules mise en évidence/désactivation qui patchent les
props en direct, et un éditeur JSON de `dataSet` - éditez, cliquez sur **Apply**, et regardez
le graphique se redessiner. Trop joué ? **Reset chart** restaure le dataSet, la mise en
évidence, et l'état de désactivation exactement à ce qu'ils étaient quand les devtools ont vu
le graphique pour la première fois - chaque édition faite depuis le panneau annulée en un
clic.

Au passage : les actions ✦ de l'onglet Insights ne sont **pas un modèle de langage** par
défaut - elles exécutent localement les plugins insights du graphique (règles et statistiques
déterministes ; l'infobulle de chaque action dit exactement ce qu'elle calcule). Rien n'est
téléchargé, rien ne quitte la page.

## Voyager dans le temps à travers l'état

Quand un graphique a changé plus d'une fois, une barre **History** apparaît : avancez `◀` /
`▶` à travers les instantanés passés du `ChartContext` pour voir exactement comment l'état a
évolué, ou cliquez sur **● live** pour revenir au dernier. En consultant un instantané passé,
les contrôles sont en lecture seule (vous inspectez l'historique, vous ne pilotez pas le
graphique). Combiné à l'onglet Diff, cela répond en quelques secondes à « à quoi ressemblait
ce graphique une mise à jour plus tôt, et qu'est-ce qui a changé ? ».

## Réel contre prédit

Le panneau rend explicite la **provenance** d'un graphique. Marquez les points de prévision
avec `predicted: true` sur le point de donnée (c'est rétrocompatible : quand omis, il se
déduit de `certainty === false`, le même indicateur qui dessine un segment en pointillés) :

```ts
const dataSet = [{
  label: "Revenue",
  series: [
    { date: 2022, value: 104, certainty: true },                    // observed
    { date: 2023, value: 121, certainty: false, predicted: true },  // forecast
  ],
}];
```

Cela remonte dans le `ChartContext` de chaque graphique sous forme de `actualCount`,
`predictedCount`, et `forecastStart` (par série sur Line, Fan, et Range), si bien que le
panneau - et tout agent IA lisant le contexte - peut distinguer le passé de la projection sans
deviner à partir des pointillés.

Le graphique empilé **Area** partage un seul x par date, donc là `predicted` est défini sur la
**ligne** entière et remonte au niveau du graphique sous forme de `stats.actualRows`,
`stats.predictedRows`, et `stats.forecastStart` :

```ts
const series = [
  { date: 2022, cloud: 60, onprem: 44 },                  // observed
  { date: 2023, cloud: 78, onprem: 40, predicted: true }, // forecast row
];
```

> [!TIP] Préférez `predicted` à `certainty` pour marquer une prévision.
> `certainty` passe aussi à `false` pour les **trous** de données détectés automatiquement
> (`detectGaps`), il ne peut donc pas distinguer une prévision d'un trou dans les données.
> `predicted` est sans ambiguïté.

**Couverture.** La provenance est une notion de série temporelle, elle est donc portée par les
graphiques où une prévision est naturelle : **Line**, **Fan**, et **Range** (par série), et
**Area** (par ligne). Les graphiques catégoriels, partie-du-tout, et relationnels (barres
empilées, bar-bell, comparable, dual, gap, pie/donut, bubble, sankey, treemap, radar,
scatter) n'ont pas d'axe de prévision, ils ne portent donc pas d'indicateur `predicted`.

## Pourquoi pas une extension de navigateur ?

Vous n'en avez pas besoin. Chaque graphique michi-vz est en **Light DOM** et expose déjà son
état (`getContext()`, `getTools()`), si bien qu'un panneau intégré à la page lit tout
directement. Cela rend les devtools :

- **Sans installation** - c'est un simple `import`, versionné avec votre application.
- **Testables avant livraison** - ils s'exécutent dans jsdom/Playwright comme n'importe quel
  autre module.
- **Agnostiques du framework** - ils découvrent aussi bien les instances impératives de
  `mountXChart()` *que* les web components `<michi-vz-*>`.
- **Sûrs en production** - protégez-les derrière `process.env.NODE_ENV !== "production"` (le
  composant React le fait pour vous) ou importez `@michi-vz/devtools/production` ; dans les
  deux cas vos utilisateurs ne les téléchargent jamais.

Une véritable extension de navigateur n'est utile que plus tard, pour inspecter michi-vz sur
des pages qui n'embarquent **pas** le module devtools. Elle réutiliserait le même hook, donc
rien ici n'est jetable.

## Comment ça marche

`@michi-vz/core` fournit un minuscule hook opt-in. `mountDevtools()` appelle
`enableDevtools()`, qui installe `globalThis.__MICHI_VZ_DEVTOOLS_HOOK__` - un registre dans
lequel chaque `mountXChart()` écrit au montage et qu'il efface au `destroy()`. Le panneau s'y
abonne pour les mises à jour et parcourt aussi le DOM à la recherche des éléments
`<michi-vz-*>` montés plus tôt. Quand les devtools ne sont jamais activés, le hook n'est
jamais créé et les graphiques ne paient qu'une seule vérification de drapeau par montage.

Vous pouvez construire votre propre interface (ou une future extension) sur la même
surface :

```ts
import { getDevtoolsHook, enableDevtools } from "@michi-vz/core";

enableDevtools();
const hook = getDevtoolsHook();           // { charts: Map, subscribe, ... }
hook?.subscribe((charts) => {
  for (const c of charts) console.log(c.chartType, c.getContext());
});
```
