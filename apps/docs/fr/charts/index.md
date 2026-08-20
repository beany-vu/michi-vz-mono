---
title: Graphiques
description: "Le catalogue de graphiques michi-vz : 22 types de graphiques pour les tendances, la composition, la comparaison, la corrélation et les flux, chacun avec des démos en direct en React, Vue, Svelte, Angular et web components."
---
# Catalogue de graphiques

Vingt-deux graphiques agnostiques du framework. Chaque page propose un exemple, l'usage dans chaque framework, et un panneau de contexte LLM.

- [**Graphique en courbes**](/fr/charts/line) - _Tendances_ · Tendances dans le temps sur une ou plusieurs séries - avec détection optionnelle des écarts, un moteur de rendu canvas optionnel (décimé par LTTB pour les grands volumes de données), et des lignes de repère à point unique.
- [**Graphique en éventail**](/fr/charts/fan) - _Tendances · Prévision_ · Un éventail de prévision : historique, une médiane de prévision en pointillés, et des bandes de confiance imbriquées qui s'élargissent avec l'horizon (composé de Ligne + Étendue).
- [**Graphique en aires**](/fr/charts/area) - _Composition_ · Part du tout dans le temps : comment la part de chaque composant dans un total empilé évolue.
- [**Nuage de points**](/fr/charts/scatter) - _Corrélation_ · Relation entre deux variables numériques ; la taille de la bulle encode une troisième variable.
- [**Graphique d'étendue**](/fr/charts/range) - _Tendances_ · Bandes min-max par série - prévisions, intervalles de confiance, ou étendues observées dans le temps.
- [**Graphique en ruban**](/fr/charts/ribbon) - _Composition_ · Colonnes empilées par période, reliées par des rubans de connexion qui tracent chaque catégorie dans le temps.
- [**Graphique radar**](/fr/charts/radar) - _Comparaison_ · Comparez plusieurs entités sur un ensemble d'axes partagé en un coup d'œil (un polygone par entité).
- [**Barres empilées verticales**](/fr/charts/vertical-stack-bar) - _Composition_ · Barres verticales empilées par catégorie, avec un garde-fou explicite de marqueur de données manquantes pour les jeux de données épars.
- [**Barres comparables**](/fr/charts/comparable) - _Comparaison_ · Deux sous-barres horizontales superposées par étiquette - une valeur « de base » vs une valeur « comparée ».
- [**Barres comparables verticales**](/fr/charts/comparable-vertical-bar) - _Comparaison_ · Deux colonnes superposées sur toute la largeur par catégorie - une valeur de base derrière, une valeur comparée devant - avec une flèche d'évolution au-dessus de chaque paire.
- [**Barres doubles (Tornado)**](/fr/charts/dual) - _Comparaison_ · Barres divergentes depuis une ligne centrale - value1 à droite, value2 à gauche (pyramides des âges, diagrammes en tornade).
- [**Barre-haltère**](/fr/charts/bar-bell) - _Composition_ · Segments horizontaux cumulatifs par ligne, avec des cercles d'extrémité marquant chaque étape.
- [**Graphique d'écart**](/fr/charts/gap) - _Comparaison_ · Deux valeurs par étiquette reliées par une barre d'écart - qui met en évidence la différence entre elles.
- [**Treemap**](/fr/charts/treemap) - _Composition_ · Tuiles hiérarchiques dimensionnées par valeur, chacune pouvant être divisée en deux parties (par ex. réalisé vs inexploité) - avec une disposition en pile adaptée au mobile.
- [**Camembert / Anneau**](/fr/charts/pie) - _Composition_ · Parts dimensionnées selon leur poids dans un tout, avec des étiquettes en % par part ; définissez `innerRadiusRatio` pour un anneau.
- [**Jauge (anneaux)**](/fr/charts/gauge) - _Comparaison_ · Des anneaux concentriques, un par élément, chacun parcourant valeur/max d'un cercle complet sur une piste de fond, avec un affichage central activé au survol.
- [**Graphique à bulles**](/fr/charts/bubble) - _Composition_ · Cercles dimensionnés par valeur, attirés en grappe par gravité, chacun pouvant être divisé en un noyau réalisé et un anneau inexploité.
- [**Sankey**](/fr/charts/sankey) - _Flux_ · Flux entre nœuds disposés en colonnes, avec une épaisseur de bande proportionnelle à la valeur du flux (construit sur d3-sankey).
- [**Fontaine (Jet d'Eau)**](/fr/charts/fountain) - _Comparaison_ · Hauteur de l'apex = valeur, le panache en éclosion = incertitude. X catégoriel = instantané/comparaison d'indicateurs clés ; x temporel ou numérique = tendance avec jets de prévision optionnels (idéal pour environ 5 à 12 périodes).
- [**Carte choroplèthe**](/fr/charts/choropleth-map) - _Géographie_ · Votre propre GeoJSON, coloré par une échelle de seuils ou une correspondance de catégories explicite, avec 13 projections d3-geo.
- [**Carte à symboles**](/fr/charts/symbol-map) - _Géographie_ · Des symboles placés par longitude/latitude, avec une simulation de forces en une passe qui écarte les cercles qui se chevauchent.
- [**Arbre radial**](/fr/charts/radial-tree) - _Composition_ · Un dendrogramme radial : des feuilles équidistantes du centre, des cercles dimensionnés au niveau du groupe et de la feuille, et une densité d'étiquettes adaptative à mesure que le nombre de feuilles augmente.
