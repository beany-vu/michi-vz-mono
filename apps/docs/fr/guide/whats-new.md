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

## v1.11.6

Versions des paquets : core **1.17.0** · wc, angular **1.12.5** · react **1.11.6** · vue, svelte **1.7.6** ·
examples **1.1.6** · devtools, insights **0.2.21**.

- **`yAxisDomain` partiel sur le [Graphique en courbes](/charts/line)** : chaque borne
  peut désormais valoir `null` pour rester dérivée des données. `[0, null]` fixe la ligne
  de base à 0 tandis que le maximum continue de suivre les séries visibles - il se
  recalcule lors des bascules de légende et des tranches Top/Bottom-N, exactement comme le
  domaine entièrement dérivé. Une borne dérivée ne croise jamais une borne fixée (des
  données toutes négatives sous `[0, null]` donnent `[0, 0]` plutôt qu'un axe inversé).
  Un `[min, max]` de nombres se comporte comme avant.

## v1.11.5

Versions des paquets : core **1.16.2** · wc, angular **1.12.4** · react **1.11.5** · vue, svelte **1.7.5** ·
examples **1.1.5** · devtools, insights **0.2.20**.

- **Les éléments de légende désactivés conservent leur position** sur le
  [nuage de points](/charts/scatter), la [barre-haltère](/charts/bar-bell) et le
  [graphique en aires](/charts/area). Leur légende était dérivée des données déjà
  filtrées : un libellé cliqué (désactivé) disparaissait de `legendData` et les replis
  côté consommateur le rajoutaient en fin de légende. Les trois conservent désormais le
  libellé marqué `disabled: true` à sa position d'origine, le même contrat que les
  légendes du diagramme empilé (core 1.5.6) et des barres comparables (core 1.12.2). Le
  contexte du nuage de points gagne aussi un résumé `series` par libellé
  (`label`/`code`/`last`) construit à partir des lignes avant filtrage : un libellé
  masqué garde ainsi sa valeur la plus récente pour le tri de légende côté consommateur.
- **`contextSignature` reste bornée avec le nouveau champ `series`** : il passe par le
  même hachage que les lignes et la légende au lieu d'être sérialisé, la signature d'un
  nuage de 50 000 points reste donc de quelques centaines d'octets.

## v1.11.4

Versions des paquets : core **1.16.1** · wc, angular **1.12.3** · react **1.11.4** · vue, svelte **1.7.4** ·
examples **1.1.4** · devtools, insights **0.2.19**.

- **Le classement Top/Bottom ignore les séries sans donnée à la date d'ancrage.** Sur le
  [graphique en ligne](/charts/line), une série sans valeur finie à la date d'ancrage
  `filter.date` se classe désormais EN DERNIER dans les **deux** sens de tri. L'ancienne
  sentinelle ne la classait dernière que sous `desc` — sous `asc` (Bottom-N) elle se
  classait *première*, si bien que le Bottom-N remplissait ses places avec les séries
  sans donnée à l'année d'ancrage au lieu des valeurs réelles les plus basses. Une ligne
  présente à l'ancrage mais portant `null`/`NaN` compte aussi comme manquante.
- **Les graduations de l'axe des dates ne dépassent plus les courbes dessinées.** Les
  graduations candidates du graphique en ligne (et l'ensemble « présent » de
  `fillPeriodTicks`) proviennent désormais du même ensemble classé/découpé/filtré par
  `disabledItems` que le domaine x. Auparavant, une série du pool écartée du classement
  mais portant une période plus récente que toute série dessinée peignait une graduation
  au-delà du bord du tracé, laissant un tronçon d'axe vide après la dernière courbe.

## v1.11.3

Versions des paquets : core **1.16.0** · wc, angular **1.12.2** · react **1.11.3** · vue, svelte **1.7.3** ·
examples **1.1.3** · devtools, insights **0.2.18**.

- **Masquer une série classée ne comble plus le vide.** Sur le
  [graphique en ligne](/charts/line), les [barres comparables horizontales](/charts/comparable)
  et les [barres comparables verticales](/charts/comparable-vertical-bar), le `filter`
  Top/Bottom classe et découpe désormais l'ensemble COMPLET *avant* le retrait des
  `disabledItems` — masquer l'une des N premières séries via la légende dessine donc
  N−1 séries au lieu de laisser la (N+1)-ième prendre la place libérée (l'ordre que le
  [graphique gap](/charts/gap) et le découpage de groupes des barres empilées ont
  toujours utilisé). Tant qu'un `filter` est actif, `legendData` conserve la série
  masquée en pastille grisée et `renderedRankedIds` liste toujours son code, si bien
  qu'une interface de sélection consommatrice reste stable à travers les bascules
  afficher/masquer. Sans `filter`, rien ne change.

## v1.11.2

Versions des paquets : core **1.15.0** · wc, angular **1.12.1** · react **1.11.2** · vue, svelte **1.7.2** ·
examples **1.1.2** · devtools, insights **0.2.17**.

- **Le contexte indique désormais ce qui est réellement affiché.** Nouveau champ
  `renderedRankedIds` sur le ChartContext partagé : les codes des séries effectivement
  dessinées, dans l'ordre de rendu (après `disabledItems` et le tri/découpage du
  `filter` Top/Bottom), émis par les builders de
  [Graphique en courbes](/fr/charts/line),
  [Barres empilées verticales](/fr/charts/vertical-stack-bar),
  [Barres comparables](/fr/charts/comparable),
  [Barres comparables verticales](/fr/charts/comparable-vertical-bar) et
  [Graphique d'écart](/fr/charts/gap). Le `code` par série est aussi exposé sur les
  contextes stack et comparable-bar, et les codes numériques ne sont plus ignorés par
  le graphique empilé. Permet à une interface de sélection de suivre un graphique
  classé (le motif « puces Top-N »).

## v1.11.1

Versions des paquets : core **1.14.0** · wc, angular **1.12.0** · react **1.11.1** · vue, svelte **1.7.1** ·
examples **1.1.1** · devtools, insights **0.2.16**.

- **Les [barres empilées verticales](/fr/charts/vertical-stack-bar) passent à l'horizontale.**
  Nouvelle propriété additive `layout: "horizontal"` : des lignes sur un axe y en bandes
  (les libellés HTML partagés avec ellipse, donc les longs noms de catégories restent
  lisibles) avec des segments empilés vers la droite depuis x(0). Les contrats de données,
  d'attribution des couleurs, de légende, d'infobulle et de marqueur manquant sont
  identiques à la disposition verticale, et les props `xAxis*` continuent de formater
  l'axe des catégories (`yAxis*`/`yTicks` l'axe des valeurs) dans les deux orientations.
  Les libellés d'abréviation de série, `xAxisMode` et `timeline` restent verticaux uniquement.

## v1.11.0

Versions des paquets : react, wc, angular **1.11.0** · core **1.13.0** · vue, svelte **1.7.0** ·
examples **1.1.0** · devtools, insights **0.2.15**.

- **Nouveau graphique : [Jauge (anneaux)](/fr/charts/gauge).** Une jauge à anneaux
  concentriques - un anneau par élément, de l'extérieur vers l'intérieur, chacun
  balayant `value/max` d'un cercle complet sur une piste de fond. Le survol active un
  anneau et pilote l'affichage central intégré ; une valeur `null` ne dessine que la
  piste. Épaisseur et espacement des anneaux, couleurs et opacités par anneau, angle de
  départ, extrémités arrondies et contenu central sont configurables, avec les moteurs
  svg, canvas et webgpu partageant le contrat de sonde de couleur standard.
- **Zoom par glissement sur le [graphique en courbes](/fr/charts/line).** Activez la
  propriété `zoom` : faites glisser une plage horizontale dans le tracé pour zoomer le
  domaine x (un rectangle de sélection le prévisualise), avec un bouton « Reset zoom »
  intégré, `minRange`, un rappel `onZoomChange` et `resetZoom()` / `setZoomDomain()`
  pour le contrôle programmatique. Les marques sont rognées au tracé ; graduations,
  réticule et infobulles suivent le domaine zoomé.
- **Les exports PNG peuvent porter un titre et une ligne de source.** `chartToPngDataUrl`
  accepte des blocs de texte `title` et `caption` (retour à la ligne automatique,
  alignement/taille/couleur configurables) composés au-dessus et en dessous du graphique.

## v1.10.4

Versions des paquets : react, wc, angular **1.10.4** · core **1.12.2** · vue, svelte **1.6.6** ·
devtools, insights **0.2.14**.

- **Les légendes des barres comparables ne se réorganisent plus quand on désactive un
  élément.** Sur les graphiques [Barres comparables](/fr/charts/comparable) et
  [Barres comparables verticales](/fr/charts/comparable-vertical-bar), un libellé listé
  dans `disabledItems` disparaissait entièrement du `legendData` émis ; les légendes
  construites dessus le rajoutaient ailleurs - un retri visible (et parfois un changement
  de couleur) à chaque clic sur la légende. Un libellé désactivé reste désormais dans
  `legendData`, marqué `disabled: true`, à sa place d'origine ; les barres, elles,
  continuent de l'exclure. C'est le contrat que les barres empilées verticales ont depuis
  core 1.5.6.

## v1.10.3

Versions des paquets : react, wc, angular **1.10.3** · core **1.12.1** · vue, svelte **1.6.5** ·
devtools, insights **0.2.13**.

- **Plus d'infobulle parasite « Chart ».** Chaque graphique injectait un `<title>` svg
  avec « Chart » en valeur par défaut pour le SEO, et les navigateurs affichent un
  `<title>` svg racine comme infobulle native au survol - survoler n'importe quel
  graphique faisait donc apparaître une petite étiquette « Chart ». L'élément n'est
  désormais injecté que si vous définissez la prop `title` ; les robots d'indexation
  conservent les métadonnées JSON-LD, et les lecteurs d'écran ne sont pas concernés
  (le svg est `aria-hidden`, la table a11y masquée reste leur représentation).
- **Les infobulles du [Graphique en courbes](/fr/charts/line) retrouvent leur série.**
  Le point transmis à `tooltipFormatter` porte de nouveau le `label` de sa série
  (`{ ...point, label }`), comme dans la bibliothèque d'avant le monorepo. Les
  infobulles qui affichent le nom de la série depuis `point.label` rendaient cette
  ligne vide depuis la migration.

## v1.10.2

Versions des paquets : react, wc, angular **1.10.2** · core **1.12.0** · vue, svelte **1.6.4** ·
devtools, insights **0.2.12**.

- **Un axe de dates chargé incline désormais ses étiquettes au lieu d'en supprimer la
  plupart.** Tous les graphiques à axe de bandes
  ([Barres empilées verticales](/fr/charts/vertical-stack-bar),
  [Barres comparables verticales](/fr/charts/comparable-vertical-bar),
  [Fontaine](/fr/charts/fountain), [Graphique en ruban](/fr/charts/ribbon),
  [Nuage de points](/fr/charts/scatter)) renonçaient à la rotation dès que les bandes
  devenaient étroites et affichaient à plat un sous-ensemble d'étiquettes. Une étiquette
  inclinée n'a besoin que de son dégagement diagonal, environ un quart de ce qu'exige une
  étiquette à plat : le graphique fait donc pivoter un sous-ensemble et conserve environ
  trois fois plus d'étiquettes. La rotation n'est retenue que si elle apporte réellement
  des étiquettes. `xAxisMode: "horizontal"` force toujours l'affichage à plat.
- **Corrigé : les étiquettes conservées pouvaient se chevaucher.** L'algorithme
  garantissait COMBIEN d'étiquettes conserver, jamais leur écartement, et pouvait donc
  choisir deux bandes voisines. Le chevauchement est maintenant mesuré exactement - la
  largeur propre de chaque paire à plat, l'écart perpendiculaire une fois incliné - et les
  étiquettes en conflit sont retirées. La première et la dernière sont toujours
  conservées, afin que l'axe montre toujours son étendue complète.
- **Les catégories `YYYYMM` suivent le calendrier.** Un axe mensuel se cale sur de vrais
  repères (chaque janvier, jan./juil., jan./avr./juil./oct.) au lieu de tomber là où
  l'arrondi décimal le plaçait. Cet arrondi était aussi la cause du chevauchement
  ci-dessus : il n'a aucun sens sur un champ de mois en base 12 et plaçait deux
  graduations de part et d'autre de chaque changement d'année. Les années à quatre
  chiffres sont inchangées, les décennies rondes leur convenant déjà.

## v1.10.1

Versions des paquets : react, wc, angular **1.10.1** · core **1.11.1** · vue, svelte **1.6.3** ·
devtools, insights **0.2.11**.

- **Corrigé :** sur [Barres empilées verticales](/fr/charts/vertical-stack-bar), les
  étiquettes de dates de l'axe des x ne se superposent plus aux abréviations de séries.
  Lorsqu'un DataSet fournit `seriesKeyAbbreviation` - la lettre courte affichée sous
  chaque colonne de groupe - les étiquettes de graduation commencent désormais sous cette
  ligne au lieu de la partager. Le problème apparaissait sous forme de texte superposé dès
  qu'un axe chargé inclinait ses étiquettes à -45°, en particulier avec des dates
  mensuelles `MM-YYYY`. Le graphique réserve également la marge inférieure
  supplémentaire correspondante, afin que les étiquettes inclinées restent visibles. Les
  graphiques dont les DataSets ne portent aucune abréviation sont inchangés.

## v1.10.0

Versions des paquets : react, wc, angular **1.10.0** · core **1.11.0** · vue, svelte **1.6.2** ·
devtools, insights **0.2.10**.

- **Faire défiler les années, sur chaque graphique.** La nouvelle prop opt-in
  `timeline` ajoute un bouton lecture + un curseur d'années intégrés (et un
  contrôleur headless `chart.timeline()`) aux 21 graphiques. Les graphiques à
  axe temporel comme [Courbes](/fr/charts/line) et [Aires](/fr/charts/area)
  tracent leurs marques jusqu'à l'année active et balaient en douceur pendant la
  lecture ; les graphiques instantanés comme [Secteurs](/fr/charts/pie),
  [Gap](/fr/charts/gap) et [Nuage de points](/fr/charts/scatter) affichent une
  période à la fois avec des valeurs qui glissent entre les années ;
  [Treemap](/fr/charts/treemap) et [Arbre radial](/fr/charts/radial-tree)
  animent des hiérarchies entières depuis des noeuds racines tagués `date` ;
  [Sankey](/fr/charts/sankey) joue sur des liens tagués `date` ; et
  [Radar](/fr/charts/radar) et [Bar-Bell](/fr/charts/bar-bell) utilisent un
  nouveau champ de ligne `period`. Désactivé par défaut partout, et chaque page
  de graphique a une démo interactive.
- **Animation de révélation sur chaque graphique.** La prop opt-in
  `progressiveDraw` fait apparaître les marques de gauche à droite au montage -
  et sur [Courbes](/fr/charts/line), des étiquettes suivent la pointe de chaque
  ligne qui grandit. `replay()` rejoue la révélation à la demande.
- Les deux fonctionnalités marchent avec les rendus `svg` et `canvas`,
  respectent `prefers-reduced-motion` (le graphique s'affiche entièrement tracé,
  instantanément) et restent volontairement inertes sur le rendu expérimental
  `webgpu`.
- **Corrigé :** un re-rendu pendant une animation en cours la reprend désormais à
  sa position actuelle au lieu de sauter à la fin - les wrappers de framework
  mettent à jour le graphique juste après le montage, ce qui annulait auparavant
  chaque autoplay de montage.
- **Corrigé :** l'URL CDN nue du bundle web component
  (`cdn.jsdelivr.net/npm/@michi-vz/wc`) pointe désormais vers le bundle
  navigateur autonome : un simple `<script type="module">` fonctionne sans devoir
  épeler le chemin `/dist/...` complet.

## v1.9.0

Versions des paquets : react **1.9.0** · core **1.10.0** · wc, angular **1.9.1** · vue, svelte **1.6.1** ·
devtools, insights **0.2.9**.

- **Téléchargez n'importe quel graphique en image ou en CSV.** Nouveaux utilitaires
  d'export dans core : `chartContextToCsv(ctx)` transforme le
  `getContext().a11yTable` de n'importe quel graphique (la table de données
  complète, jamais tronquée, que chaque graphique embarque) en CSV RFC 4180 sans
  code par graphique, et `chartToStyledSvgString` / `chartToStyledSvgDataUri` /
  `chartToPngDataUrl` reconstruisent un SVG ou un PNG autonome et correctement
  stylé. Les images exportées perdaient jusqu'ici le quadrillage, les étiquettes
  d'axes et la ligne zéro, car le CSS des graphiques vit dans
  `adoptedStyleSheets`, invisible pour un sérialiseur naïf ; l'export PNG
  superpose aussi les marques du renderer canvas sur les axes SVG. Les handles
  React gagnent `getElement()` pour fournir l'élément aux utilitaires sans
  requête DOM globale fragile.
- **Une seule infobulle, toutes les séries.** Le `sharedTooltip` de LineChart
  (avec un `sharedTooltipFormatter` optionnel) affiche une infobulle unique
  listant la valeur de chaque série à l'année la plus proche, à côté du
  réticule, au lieu de la seule série la plus proche. Relayé par le web
  component et le wrapper Angular. Voir [Line](/fr/charts/line).
- **La table a11y porte désormais les données elles-mêmes.** Le `a11yTable` de
  LineChart devient une table large par période : une colonne par valeur x
  étiquetée comme l'axe, une ligne par série, `-` pour les trous. Un export CSV
  depuis `getContext()` contient donc chaque point tracé. Les statistiques par
  série restent sur `context.series` ; c'est le seul changement de comportement
  de cette version.
- **Parité d'axes pour le graphique Gap.** [Gap](/fr/charts/gap) gagne
  `showZeroLineForXAxis` (une ligne verticale pleine à x=0, désormais tracée
  indépendamment de `showGrid`) et `maxBarHeight` (un graphique de 1 à 2 lignes
  n'étire plus ses barres sur toute la hauteur), et les axes de valeurs
  numériques de Gap et de [Comparable](/fr/charts/comparable) inclinent les
  graduations trop denses à -45° avant de les éclaircir, comme le faisaient déjà
  les axes de dates.
- **Des étiquettes corrigées sur les graphiques à bandes.** Les étiquettes de
  ligne se limitent à deux lignes avec points de suspension au lieu de chevaucher
  leurs voisines ; les longs libellés de catégories pivotent au lieu d'être
  éclaircis à tort ; une étiquette de [Bubble](/fr/charts/bubble) collée au bord
  droit bascule à gauche de son point plutôt que d'être rognée ; et
  [Comparable Vertical Bar](/fr/charts/comparable-vertical-bar) peint la
  sous-barre la plus courte au-dessus (une ligne dont la valeur « avant » était
  la plus petite la cachait entièrement derrière la barre la plus haute), avec la
  flèche d'évolution désormais centrée au-dessus de chaque paire.

## v1.8.1

Versions des paquets : react **1.8.1** · core, wc, angular **1.9.0** · vue, svelte **1.6.0** ·
devtools, insights **0.2.8**.

- **Quatre nouveaux graphiques : l'atlas passe à 21.** [Comparable Vertical Bar](/fr/charts/comparable-vertical-bar)
  (deux colonnes superposées par catégorie, l'« avant » hachuré derrière l'« après » plein,
  avec une flèche d'évolution au-dessus de chaque paire), et la première famille géographique
  de la bibliothèque : [Choropleth Map](/fr/charts/choropleth-map) (votre propre GeoJSON,
  13 projections, coloration par seuils ou par catégories), [Symbol Map](/fr/charts/symbol-map)
  (bulles lng/lat avec fond de carte discret optionnel) et [Radial Tree](/fr/charts/radial-tree)
  (dendrogramme radial, cercles dimensionnés au niveau du groupe et de la feuille).
- **Axes logarithmiques sur LineChart.** `yAxisScale: "log"` pour des données couvrant
  plusieurs décades : les valeurs non positives deviennent manquantes (avec avertissement)
  et les étiquettes trop denses se réduisent aux puissances de dix. Voir [Line](/fr/charts/line).
- **Vrai empilement 100 % sur AreaChart.** `stackOffset: "expand"` transforme toute aire
  empilée en parts du total : un vrai empilement d3, pas un simple rescale d'affichage.
  Voir [Area](/fr/charts/area).
- **Barres comparables, deux nouveautés.** `layout: "grouped"` scinde chaque bande en deux
  moitiés côte à côte au lieu de les superposer, et `deltaIndicator` dessine une flèche
  d'évolution rouge/verte par ligne. Voir [Comparable](/fr/charts/comparable).
- **Des positions de symboles honnêtes.** Le `positionMode: "precise"` de Symbol Map garde
  chaque bulle exactement à son lng/lat projeté (chevauchements permis) au lieu de la
  simulation anti-chevauchement par défaut : le bon choix dès qu'un fond de carte visible
  invite à lire les positions au pied de la lettre. Une bascule en direct sur la
  [page Symbol Map](/fr/charts/symbol-map) montre la différence.
- **Des étiquettes là où il en manquait.** Scatter gagne `pointLabels` et un choix
  `drawOrder` (petits au-dessus par défaut, ou l'ordre hérité grands au-dessus) ; Treemap
  peut afficher la valeur de chaque tuile avec `tileValueLabels`. Les recouvrements de
  chargement et d'absence de données couvrent désormais aussi Radar, Sankey et Treemap,
  et les marques s'effacent correctement tant qu'un recouvrement est affiché.

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
