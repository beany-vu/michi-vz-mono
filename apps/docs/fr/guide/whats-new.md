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

## v1.6.5

Versions des packages : react **1.6.5** · core, wc, angular **1.6.0** · vue, svelte **1.5.7** ·
devtools, insights **0.2.5**.

- **RibbonChart échange enfin les places.** La pile de chaque période est désormais reclassée
  par valeur : une catégorie qui en dépasse une autre croise visiblement les rubans en montant,
  tout l'intérêt d'un graphique en ruban, restauré depuis la bibliothèque d'origine. À voir sur
  la [page Ruban](/fr/charts/ribbon) : les revenus de la musique aux États-Unis, où le streaming
  dépasse tout et le vinyle repasse devant le CD.
- **Des barres comparables enfin lisibles.** La sous-barre la plus courte se dessine de nouveau
  au-dessus (une barre qui a grandi ne cache plus son « avant »), et le nouveau
  `colorsBasedMapping` donne sa propre couleur à la barre « avant » : associez une teinte claire
  opaque à `valueBasedOpacity: 1` pour un contraste pâle/plein net dans les deux thèmes.
  Voir [Barres comparables](/fr/charts/comparable).
- **Des nuages de bulles sans blocage.** `layoutMode: "async"` exécute le même tassement de
  forces déterministe en tranches d'environ 12 ms derrière l'overlay de chargement du
  graphique : un amas de 3 000 bulles qui gelait la page pendant ~20 secondes ne coûte plus
  qu'une frame de 50 ms au pire. `settleTicks` règle le tassement, des entrées inchangées
  sautent entièrement la simulation, et la disposition est mémoïsée entre les rendus.
  Voir la démo « événement de collision » sur [Bulles](/fr/charts/bubble).
- **Petits réglages, grand confort.** L'axe des valeurs du Barre-haltère peut passer sous le
  tracé (`xAxisPosition: "bottom"`), le GapChart accepte un `xAxisDomain` explicite (zoomer une
  histoire d'espérance de vie dans sa bande 35-90), les libellés de lignes du tornado peuvent
  passer à gauche du tracé (`yAxisPosition: "left"`), les libellés des pôles du radar ne
  touchent plus le titre, et le résumé de contexte du tornado nomme désormais son plus grand
  déséquilibre.
- **Des libellés de lignes que l'on peut saisir - et parcourir.** Sur Gap, Comparable et le
  tornado, l'option `interactiveRowLabels` fait de chaque libellé de ligne un vrai contrôle :
  survolez-le ou donnez-lui le focus et une ligne de rappel court jusqu'à sa ligne avec
  l'infobulle et la mise en évidence ; un clic épingle. La gouttière des libellés se parcourt
  aussi comme un curseur : faites-la glisser et l'infobulle suit votre pointeur de ligne en
  ligne, jusqu'aux lignes dont le libellé a été allégé sur un axe dense. À essayer sur les
  démos de ces pages.
- **Une légende pour tout.** Chaque contexte de graphique porte désormais `legendData`, et les
  graphiques à division (treemap, bulles, comparables) exposent aussi la couleur pâle compagne
  de chaque étiquette via `LegendItem.paleColor` : les démos de la doc s'en servent pour leurs
  légendes et la bascule « Signification | Paires de couleurs ».
- **Les axes denses s'allègent seuls.** Les libellés de lignes de gap/comparable/dual/barre-haltère
  (et l'axe instantané de la fontaine) s'échantillonnent en un sous-ensemble lisible au lieu de
  se superposer à 100+ lignes.
- **Doc : appuyez sur les boutons.** Chaque page de graphique propose désormais les actions en
  direct « ✦ Expliquer ce graphique » (le vrai moteur de règles insights, dans votre navigateur)
  et « 🛠 Essayer les DevTools sur ce graphique », plus de nouveaux exemples qui racontent une
  histoire : le spectre dimuon du LHC sur [Nuage de points](/fr/charts/scatter), les salaires
  bruts vs nets de l'UE sur [Bulles](/fr/charts/bubble), et une fresque d'espérance de vie de
  ~195 pays sur [Écart](/fr/charts/gap).
- **La Fontaine apprend à s'expliquer.** La [page Fontaine](/fr/charts/fountain) s'ouvre
  désormais sur un glossaire d'anatomie (chaque partie visible du glyphe a un sens énoncé) et
  un guide pratique de onze lectures en direct : certitude, stabilité, risque, confiance d'une
  IA, audiences divisées, typhons philippins et plus, la plupart dans la silhouette symétrique
  épurée du panache.
  La symétrie porte aussi du sens : un `lean: 0` explicite tient le jet parfaitement droit,
  un `lean` signé signale un risque unilatéral, et un jet sans `lean` garde sa dérive
  décorative genevoise (rapportée comme `lean: null` dans `getContext()`).

## v1.6.1 - v1.6.4

Versions des packages : react **1.6.4** · devtools, insights **0.2.4** · core, wc, vue,
svelte, angular **1.5.6**. Quatre petites vagues de correctifs entre les versions phares :

- **L'axe des valeurs du GapChart, durci trois fois.** Les `tickValues` fournis par le
  consommateur sont filtrés aux valeurs finies, triés et dédupliqués (les entrées dégénérées
  retombent sur le domaine des données) ; les marques et l'axe ne débordent plus quand des
  `tickValues` sont passés alors que `enableExplicitTickValues` est désactivé ; et les
  domaines en pourcentage gagnent un rembourrage adapté à la plage, pour qu'un marqueur de
  référence à zéro se pose sur l'axe au lieu d'en dépasser le bord.
- **La légende du VerticalStackBar garde ses couleurs.** Une clé désactivée reste dans
  `legendData`, marquée `disabled: true` : la pastille de légende s'estompe au lieu de
  disparaître, et les emplacements de couleur sont attribués sur l'ensemble complet des
  clés - aucune clé ne change de couleur en désactivant puis réactivant. Les barres
  continuent d'exclure les clés désactivées.

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
