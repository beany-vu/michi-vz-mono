---
title: Jauge (anneaux)
description: "Jauge à anneaux concentriques : chaque anneau balaie valeur/max d'un cercle complet sur une piste de fond, avec activation au survol et un affichage central intégré."
---
# Jauge (anneaux)

<span class="vp-badge tip">Composition</span>

« Où en est chacun de ces indicateurs, sur une même échelle ? » La jauge répond avec des anneaux concentriques, de l'extérieur vers l'intérieur : chaque anneau balaie `value / max` d'un cercle complet, dans le sens horaire depuis 12 h, au-dessus d'une piste de fond. Survoler un anneau **l'active** (mise en évidence + affichage central intégré) ; `defaultActive` choisit l'anneau au repos, et un anneau dont la valeur est `null` ne dessine que sa piste - « pas de donnée » sans masquer la jauge.

<ChartDemo chart="gauge-chart" :legend="false" />

Presque tout est configurable : épaisseur et espacement des anneaux, couleurs et opacités de piste par anneau, angle de départ, extrémités arrondies, opacité d'arc par anneau (designs monochromes), et l'affichage central - remplacez-le avec `centerContent`, ou désactivez-le avec `showCenterLabel: false` et pilotez votre propre calque via `onHighlightItem` :

<ChartDemo chart="gauge-chart" :index="1" :legend="false" />

> Les anneaux partagent une seule échelle (`max`, 100 par défaut). Pour des valeurs d'échelles différentes, normalisez d'abord - ou préférez un [graphique à barres comparables](/fr/charts/comparable), plus précis en valeurs absolues.

## Demi-jauge et dégradés

`sweepAngle` réduit la jauge d'un cercle complet à un arc, dans le sens horaire depuis `startAngle` ; `gradient` remplace la couleur unie d'un anneau par un dégradé linéaire multi-étapes. La demi-jauge classique est `startAngle: -90, sweepAngle: 180` :

<ChartDemo chart="gauge-chart" :index="2" :legend="false" />

Deux pièges fréquents à la première lecture :

- **La piste suit aussi le balayage.** La piste de fond d'une demi-jauge est un demi-cercle, pas un cercle complet - `sweepAngle` raccourcit la piste et l'arc de valeur ensemble, il n'y a donc pas d'« autre moitié » cachée qui transparaîtrait.
- **Le dégradé est ancré sur le balayage complet, pas sur la portion dessinée.** Une couleur donnée reste toujours à la même *valeur*, pas à la même position le long de l'arc effectivement tracé - une jauge à moitié pleine affiche donc la première moitié du dégradé, pas le dégradé entier compressé dans la moitié. Le `gradient` propre à un anneau prime sur celui défini au niveau du graphique.

## Positionnement dans une plage

Une jauge peut aussi répondre à « où se situe cette valeur entre un minimum et un maximum ? » : `min` déplace le début du balayage hors du zéro, `valueMarker` épingle la valeur de chaque anneau sur l'arc, `ticks` ajoute des repères avec une légende et une valeur, `endLabels` nomme les deux extrémités d'un balayage partiel, et `sweepFit` ajuste une demi-jauge à sa boîte au lieu de centrer un cercle complet :

<ChartDemo chart="gauge-chart" :index="3" :legend="false" />

Le consommateur possède chaque texte : passez `label` et `valueLabel` sur un repère ou une extrémité, déjà traduits et formatés ; seul un `valueLabel` absent retombe sur `valueFormatter`. Trois détails à connaître :

- **L'échelle est `[min, max]`.** Une valeur d'anneau ou un repère hors de l'échelle est ramené à l'extrémité la plus proche (avec un avertissement de données) : un fournisseur moins cher que toutes les références reste visible, épinglé au début.
- **Les repères et les extrémités décrivent l'échelle, les marqueurs décrivent les anneaux.** Une jauge à plusieurs anneaux trace les repères une seule fois, sur l'anneau extérieur, et un marqueur par anneau avec donnée ; un anneau `null` garde les repères et perd son marqueur.
- **`sweepFit` réserve une bande de 36 px** de chaque côté tant que des repères ou des extrémités existent, et ancre l'affichage central (`centerContent`) au milieu de la boîte balayée. Sur un anneau complet de 360°, seule la réserve pour les repères s'applique.

Les trois moteurs de rendu affichent les mêmes annotations : en mode canvas et WebGPU elles vivent dans un calque au-dessus des arcs peints, donc le CSS du consommateur sur `.mv-gauge-tick-label`, `.mv-gauge-tick-value` et `.mv-gauge-marker` s'applique partout.

## Valeurs de référence au survol

Les étiquettes sur l'arc sont volontairement courtes. `annotationTooltipFormatter` donne à
chaque annotation — le marqueur de valeur, un repère, l'une ou l'autre extrémité — son
propre affichage, de sorte que le chiffre précis est à un survol de distance sans surcharger
le graphique :

<ChartDemo chart="gauge-chart" :index="4" :legend="false" />

La fonction reçoit l'annotation survolée (`kind`, plus `end` pour une extrémité), sa position
sur l'échelle, les `label` et `valueLabel` tels qu'ils sont dessinés, et l'anneau (`ring`)
auquel appartient un marqueur (`null` pour les repères et les extrémités, qui décrivent
l'échelle et non un anneau en particulier). Renvoyez `null` ou `""` pour n'afficher
rien pour cette annotation.

Deux conséquences de ce câblage :

- **Survoler une annotation ne change pas l'anneau actif.** L'affichage central reste en
  place pendant l'inspection d'une valeur de référence : les deux affichages répondent à des
  questions différentes.
- **Cela fonctionne dans tous les moteurs de rendu.** Les annotations dessinées ne reçoivent
  aucun événement de pointeur (un marqueur qui l'accepterait déclencherait `mouseleave` sur
  la cellule d'anneau en dessous et ferait disparaître à la fois l'emphase et l'affichage
  central), le survol est donc résolu à partir de la géométrie au niveau de l'hôte, pas du DOM.

Un anneau sans valeur n'a aucun marqueur à survoler, mais les repères et les extrémités de
son échelle restent survolables : la plage reste réelle même quand une série n'a rien.

## Quand l'utiliser

- **Parts de marché imbriquées.** La part d'un produit sur des périmètres emboîtés (monde, région, marché) en une seule figure compacte.
- **Anneaux de progression / KPI.** Style bracelet d'activité : une seule teinte avec des paliers d'opacité, `roundedCaps`, et un affichage central personnalisé.

## Moteurs de rendu

`renderer: "svg"` (défaut), `"canvas"` (les mêmes anneaux sur un canvas 2D ; le CSS du consommateur atteint toujours les arcs via la sonde de couleur), ou `"webgpu"` <span class="vp-badge warning">Expérimental</span> (bandes d'anneaux sur le GPU ; retombe sur canvas tant que le périphérique n'est pas prêt).
