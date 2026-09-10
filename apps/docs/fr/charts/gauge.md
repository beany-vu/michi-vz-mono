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

## Quand l'utiliser

- **Parts de marché imbriquées.** La part d'un produit sur des périmètres emboîtés (monde, région, marché) en une seule figure compacte.
- **Anneaux de progression / KPI.** Style bracelet d'activité : une seule teinte avec des paliers d'opacité, `roundedCaps`, et un affichage central personnalisé.

## Moteurs de rendu

`renderer: "svg"` (défaut), `"canvas"` (les mêmes anneaux sur un canvas 2D ; le CSS du consommateur atteint toujours les arcs via la sonde de couleur), ou `"webgpu"` <span class="vp-badge warning">Expérimental</span> (bandes d'anneaux sur le GPU ; retombe sur canvas tant que le périphérique n'est pas prêt).
