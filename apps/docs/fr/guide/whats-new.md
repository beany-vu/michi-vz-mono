# Nouveautés

Les dernières versions de `@michi-vz`, de la plus récente à la plus ancienne. Les six
packages -
[core](https://www.npmjs.com/package/@michi-vz/core),
[wc](https://www.npmjs.com/package/@michi-vz/wc),
[react](https://www.npmjs.com/package/@michi-vz/react),
[vue](https://www.npmjs.com/package/@michi-vz/vue),
[svelte](https://www.npmjs.com/package/@michi-vz/svelte),
[angular](https://www.npmjs.com/package/@michi-vz/angular) - sont versionnés ensemble
(chaque version liste les éventuels packages ayant avancé plus vite). Le détail complet
par commit se trouve dans les
[releases GitHub](https://github.com/beany-vu/michi-vz-mono/releases).

## v1.6.0

Versions des packages : react **1.6.0** · devtools **0.2.0** · insights **0.2.0** · core, wc,
vue, svelte, angular **1.5.2**.

- **DevTools 0.2.0 : le bouton bascule du blason Michi.** Monter les devtools ne recouvre
  plus votre application - il démarre sous la forme d'un petit blason flottant (l'emblème
  de la bibliothèque). Cliquez dessus, ou appuyez sur `Ctrl/Cmd+Shift+M`, pour ouvrir le
  panneau ; l'état ouvert/fermé est mémorisé par navigateur, donc un rechargement le
  restaure exactement comme vous l'aviez laissé. Un coin déjà pris par un autre widget
  flottant ? **Faites glisser le blason n'importe où** - cet emplacement est aussi mémorisé,
  et la nouvelle option `buttonPosition` choisit le coin de départ. Le handle a gagné
  `isOpen()`, et `<MichiVzDevtools />` (react 1.6.0) transmet `buttonPosition`. Voir
  [DevTools](/fr/guide/devtools).
- **Insights 0.2.0 : liaison inter-jeux de données avec `matchLabels()`.** Relie les mêmes
  entités entre deux listes orthographiées différemment (un export CRM contre un export
  ERP) pour que deux jeux de données ne forment plus qu'un seul graphique joint : meilleure
  correspondance mutuelle par défaut, filtrée par une marge de confiance, les lignes non
  appariées étant renvoyées avec une suggestion « vouliez-vous dire ». Le hachage sans
  modèle fonctionne hors ligne ; le backend MiniLM relie aussi les synonymes, abréviations
  et traductions. Essayez la démo en direct
  [MatchLab](/fr/guide/insights#clean-match-and-search-your-data).
- **Core 1.5.2 : corrections de performance sur les pages lourdes.** La protection
  d'idempotence de `onChartDataProcessed` signe désormais les contextes via un hachage
  FNV-1a borné plutôt que de sérialiser chaque ligne en chaîne (plusieurs Mo de chaîne par
  rendu à 50 000 points), et le survol des nuages de points en canvas/WebGPU regroupe la
  rafale de pointeurs de chaque frame en une seule passe `requestAnimationFrame` finale.
  Les grands tableaux de bord restent réactifs sans rien à configurer.
- **La doc, désormais en quatre langues.** Le site parle anglais, français, néerlandais et
  vietnamien, avec un sélecteur de langue dans la barre de navigation - chaque page de guide,
  de graphique et d'API est traduite. Les contributions aux traductions sont les bienvenues ;
  voir le lien **Aider à traduire** dans le pied de page.
- **Une page d'accueil plus nette.** La page d'accueil met désormais en avant les DevTools et
  quatre piliers en langage clair - tout inspecter, des graphiques que les machines lisent,
  accessible par défaut, et fonctionne en local. Un nouveau pied de page vous invite à mettre
  une étoile au dépôt, rejoindre la communauté, contribuer et aider à traduire. Le blason Michi
  est le favicon du site et se trouve à côté du titre de la barre de navigation, et chaque page
  a une description unique et une carte sociale.

## v1.5.0

- **Les DevTools arrivent : `@michi-vz/devtools` 0.1.0, première publication publique.** Un
  panneau intégré à la page (sans extension de navigateur) qui inspecte l'état en direct de
  chaque graphique à travers huit onglets - Overview (avec édition en direct +
  **Réinitialiser le graphique**), Sizing, Scales, Diff, Hit-test, Profiler, Insights, et un
  audit A11y. Isolé en Shadow DOM, redimensionnable, thème clair + sombre, désactivé en
  production par défaut avec une entrée `/production` neutre, et une seule ligne pour React :
  `<MichiVzDevtools />`. Voir [DevTools](/fr/guide/devtools).
- **Insights 0.1.0 : une IA transparente et locale d'abord.**
  [Méthodologie](/fr/guide/insights#methodology---the-exact-logic-behind-every-insight)
  détaille désormais la logique exacte derrière chaque insight ; `describeModelSource()`
  indique ce qu'un backend de modèle téléchargerait et depuis où **avant** tout chargement ;
  `modelSource` redirige les téléchargements vers un miroir ou des fichiers auto-hébergés
  (ou les interdit totalement) ; et `ollamaCaller` / `openaiCompatCaller` connectent une IA
  locale (Ollama, LM Studio, llama.cpp) en une ligne sans aucun téléchargement. Les
  résultats d'anomalies portent désormais leur méthode, leur seuil, et une explication en
  langage clair.
- **Core :** le hook des devtools a gagné des canaux haute fréquence de tests de collision
  (hit-test) et de chronométrage des rendus (coût nul lorsque les devtools sont
  désactivés).

## v1.4.0

- **Le réticule au survol est de retour - et configurable.** La ligne verticale de la souris
  de LineChart est de nouveau activée par défaut (parité avec l'ancienne version ; le
  portage l'avait silencieusement désactivée), s'accroche au point de données le plus
  proche au lieu de suivre le curseur brut, et se masque quand le curseur quitte le
  graphique - dans les modes SVG, canvas et WebGPU indifféremment. Personnalisez-la par
  graphique avec `enableMouseLine: { stroke, strokeWidth, strokeDasharray, snap }`, ou
  thématisez-la globalement avec les variables CSS `--michi-vz-crosshair` /
  `--michi-vz-crosshair-width` / `--michi-vz-crosshair-dash`, ou passez `false` pour la
  désactiver.

## v1.3.0

- **Aucune période oubliée sur l'axe des x.** Les axes de dates de LineChart conservent
  désormais toujours la véritable première et dernière période (les graduations
  temporelles brutes de `d3` avaient tendance à s'aligner sur des bornes rondes et à les
  supprimer), et les libellés surchargés pivotent automatiquement de -45° puis sont
  réduits à environ 5 au lieu de disparaître silencieusement.
- **Chronologies continues avec `fillPeriodTicks` (Line + Area, opt-in).** Une graduation
  pour chaque période de la plage, pas seulement celles présentes dans les données ; les
  périodes manquantes s'affichent estompées avec une infobulle « aucune donnée » au
  survol, personnalisable via `noDataTickTooltip` et `noDataTickColor`.

## v1.2.1

- **Chaque page npm renvoie vers ses pages sœurs.** Le README de chaque package comporte
  désormais un tableau *Framework packages* reliant les six packages, afin que depuis
  n'importe quel wrapper vous puissiez atteindre les autres. Un lien mort vers le monorepo
  a été corrigé.
- **Les six packages réalignés.** `vue`, `angular`, `svelte` et `wc` avaient une version de
  retard sur npm ; ils sont désormais publiés en même temps que `core` et `react`, à la
  même version.
- **Découvrabilité de la documentation.** Le tableau [Installation](/fr/guide/installation)
  relie chaque package à npm, et il y a un bouton npm sur la page d'accueil ainsi qu'une
  icône npm dans la navigation supérieure.

## v1.2.0

La version de **compatibilité directe (drop-in)** : les packages scopés `@michi-vz/*`
peuvent remplacer l'ancien package unique `michi-vz` sans aucune régression de graphique.
Tout est rétrocompatible.

- **Contexte agnostique du moteur de rendu.** `legendData` (le contrat de couleur par
  série pour les consommateurs en canvas / mode skip) sur les contextes
  Line/Gap/Area/Scatter/BarBell/Radar ; `renderedData` / `visibleItems` ; chaque
  `on*Processed` est désormais idempotent, donc il ne se déclenche que lorsque le contexte
  change réellement et ne boucle jamais.
- **LineChart.** États de chargement / absence de données, configuration des axes
  (`yTicks`, lignes de grille, mise en évidence de la ligne zéro), `fontFamily`, et
  `svgChildren` fournis par le consommateur.
- **Davantage de props de graphiques.** Légende de forme pour Gap ; `maxBarHeight` /
  `symmetricXDomain` pour Comparable ; rotation des libellés + `keys` pour
  VerticalStackBar ; échelle en bandes, réticule et formes par point pour Scatter ; forme
  de données héritée + tests de collision tolérants pour Radar.
- **Axes, SEO et a11y.** Rotation automatique adaptative et réduction des graduations sur
  les axes surchargés ; le `<svg>` du graphique porte désormais `<title>`, `<desc>` et des
  `<metadata>` JSON-LD schema.org.
- **Rendu WebGPU expérimental** aux côtés du SVG et du canvas.

## v1.1.1

- **Correction Bar-Bell.** Les cercles d'extrémité se dessinent désormais par-dessus les
  segments de barre (auparavant, un segment ultérieur pouvait peindre par-dessus
  l'extrémité du segment précédent), et tout le segment est survolable pour les infobulles,
  pas seulement le cercle d'extrémité.
