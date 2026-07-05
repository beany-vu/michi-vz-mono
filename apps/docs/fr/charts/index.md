---
title: Graphiques
description: "Le catalogue de graphiques michi-vz : 17 types de graphiques pour les tendances, la composition, la comparaison, la corrélation et les flux, chacun avec des démos en direct en React, Vue, Svelte, Angular et web components."
---
# Catalogue de graphiques

Dix-sept graphiques agnostiques du framework. Chaque page propose un exemple, l'usage dans chaque framework, et un panneau de contexte LLM.

- [**Graphique en courbes**](/fr/charts/line) - _Tendances_ · Tendances dans le temps sur une ou plusieurs séries - avec détection optionnelle des écarts, un moteur de rendu canvas optionnel (décimé par LTTB pour les grands volumes de données), et des lignes de repère à point unique.
- [**Graphique en éventail**](/fr/charts/fan) - _Tendances · Prévision_ · Un éventail de prévision : historique, une médiane de prévision en pointillés, et des bandes de confiance imbriquées qui s'élargissent avec l'horizon (composé de Ligne + Étendue).
- [**Graphique en aires**](/fr/charts/area) - _Composition_ · Part du tout dans le temps : comment la part de chaque composant dans un total empilé évolue.
- [**Nuage de points**](/fr/charts/scatter) - _Corrélation_ · Relation entre deux variables numériques ; la taille de la bulle encode une troisième variable.
- [**Graphique d'étendue**](/fr/charts/range) - _Tendances_ · Bandes min-max par série - prévisions, intervalles de confiance, ou étendues observées dans le temps.
- [**Graphique en ruban**](/fr/charts/ribbon) - _Composition_ · Colonnes empilées par période, reliées par des rubans de connexion qui tracent chaque catégorie dans le temps.
- [**Graphique radar**](/fr/charts/radar) - _Comparaison_ · Comparez plusieurs entités sur un ensemble d'axes partagé en un coup d'œil (un polygone par entité).
- [**Barres empilées verticales**](/fr/charts/vertical-stack-bar) - _Composition_ · Barres verticales empilées par catégorie, avec un garde-fou explicite de marqueur de données manquantes pour les jeux de données épars.
- [**Barres comparables**](/fr/charts/comparable) - _Comparaison_ · Deux sous-barres horizontales superposées par étiquette - une valeur « de base » vs une valeur « comparée ».
- [**Barres doubles (Tornado)**](/fr/charts/dual) - _Comparaison_ · Barres divergentes depuis une ligne centrale - value1 à droite, value2 à gauche (pyramides des âges, diagrammes en tornade).
- [**Barre-haltère**](/fr/charts/bar-bell) - _Composition_ · Segments horizontaux cumulatifs par ligne, avec des cercles d'extrémité marquant chaque étape.
- [**Graphique d'écart**](/fr/charts/gap) - _Comparaison_ · Deux valeurs par étiquette reliées par une barre d'écart - qui met en évidence la différence entre elles.
- [**Treemap**](/fr/charts/treemap) - _Composition_ · Tuiles hiérarchiques dimensionnées par valeur, chacune pouvant être divisée en deux parties (par ex. réalisé vs inexploité) - avec une disposition en pile adaptée au mobile.
- [**Camembert / Anneau**](/fr/charts/pie) - _Composition_ · Parts dimensionnées selon leur poids dans un tout, avec des étiquettes en % par part ; définissez `innerRadiusRatio` pour un anneau.
- [**Graphique à bulles**](/fr/charts/bubble) - _Composition_ · Cercles dimensionnés par valeur, attirés en grappe par gravité, chacun pouvant être divisé en un noyau réalisé et un anneau inexploité.
- [**Sankey**](/fr/charts/sankey) - _Flux_ · Flux entre nœuds disposés en colonnes, avec une épaisseur de bande proportionnelle à la valeur du flux (construit sur d3-sankey).
- [**Fontaine (Jet d'Eau)**](/fr/charts/fountain) - _Comparaison_ · Hauteur de l'apex = valeur, le panache en éclosion = incertitude. X catégoriel = instantané/comparaison d'indicateurs clés ; x temporel ou numérique = tendance avec jets de prévision optionnels (idéal pour environ 5 à 12 périodes).
