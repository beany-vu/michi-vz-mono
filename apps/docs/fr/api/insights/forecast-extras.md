---
title: API Forecast extras - saisonnalité, points de rupture, Monte Carlo, goal-seek
---

# Forecast extras : saisonnalité, points de rupture, Monte Carlo et goal-seek

Au-delà du [plugin `forecast()`](/fr/api/insights/forecast), le sous-chemin `@michi-vz/insights/forecast`
fournit un ensemble d'aides pures et déterministes qui fonctionnent sur un simple `number[]` - aucun graphique requis. Chacune est
une méthode nommée et classique ; pour l'histoire et les démos, voir le **[guide Insights](/fr/guide/insights#more-from-the-toolbox)**.

## Import

```ts
import {
  decompose, detectPeriod,          // seasonality
  detectChangepoints,               // regime shifts
  monteCarloForecast,               // simulation
  requiredGrowth, requiredRunRate, pacingToGoal, // goal-seek
} from "@michi-vz/insights/forecast";
```

## Saisonnalité : `decompose` / `detectPeriod`

La décomposition additive classique divise une série en une tendance lissée, une composante saisonnière
répétitive, et le résidu restant (`values = trend + seasonal + residual`). `detectPeriod` trouve la longueur
du cycle seul, par autocorrélation.

<PluginLab feature="seasonal" />

```ts
const period = detectPeriod(values);            // e.g. 4 (quarterly), or 1 if not clearly periodic
const { trend, seasonal, residual } = decompose(values, period);
```

| Fonction | Signature | Retourne |
| --- | --- | --- |
| `detectPeriod` | `(values: number[], maxPeriod?: number) => number` | Période dominante (décalage avec l'autocorrélation la plus élevée) ; `1` en l'absence de cycle clair. `maxPeriod` vaut par défaut `min(floor(n/2), 24)`. |
| `decompose` | `(values: number[], period?: number) => Decomposition` | `{ trend, seasonal, residual, period }` - chacun un tableau de la longueur de `values`. `period` vaut par défaut `detectPeriod(values)`. |

Un faible écart-type résiduel signifie que la tendance et la saison expliquent presque tout le mouvement -
autrement dit, comment séparer une vraie croissance de "c'est encore décembre".

## Points de rupture : `detectChangepoints`

Trouve les indices où la pente de la tendance change structurellement (une droite des moindres carrés
ordinaires est ajustée de part et d'autre de chaque scission candidate ; les maxima locaux de
`|slopeAfter - slopeBefore|` au-dessus d'un seuil sont conservés).

<PluginLab feature="changepoints" />

```ts
const points = detectChangepoints(values, { minSegment: 3 });
// → [{ index, slopeBefore, slopeAfter, delta }, ...]
```

| Option | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `minSegment` | `number` | `3` | Nombre minimum de points de chaque côté d'une scission (aussi l'écart minimum entre deux points de rupture). |
| `threshold` | `number` | écart-type de la courbe de delta de pente | Force de courbure minimale pour qu'une scission compte ; la valeur par défaut s'ajuste à la série. |

Chaque `Changepoint` est `{ index, slopeBefore, slopeAfter, delta }`, où `index` marque le début du
segment "après".

## Simulation : `monteCarloForecast`

Exécute de nombreux futurs simulés autour de la prévision ponctuelle (chaque pas perturbé par un bruit
résiduel gaussien qui croît avec `sqrt(step)`), puis rapporte la trajectoire moyenne, une bande empirique
et des probabilités de dépassement. Déterministe via un PRNG à graine - la même `seed` rejoue toujours
le même résultat.

<PluginLab feature="montecarlo" />

```ts
const mc = monteCarloForecast(values, { horizon: 4, runs: 500, seed: 1, level: 0.95 });
mc.predictions; // mean path (length = horizon)
mc.lower; mc.upper; // band edges per step
mc.probabilityAbove(target); // fraction of runs finishing strictly above `target`
mc.probabilityBelow(target);
```

| Option | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `horizon` | `number` | (requis) | Pas à simuler dans le futur. |
| `runs` | `number` | `500` | Nombre de futurs simulés. |
| `seed` | `number` | `1` | Graine PRNG pour la reproductibilité. |
| `level` | `number` | `0.95` | Masse de probabilité centrale conservée dans la bande. |
| `method` | `ForecastMethod` | `"holt-winters"` | Modèle utilisé pour la trajectoire centrale. |

## Goal-seek : `requiredGrowth` / `requiredRunRate` / `pacingToGoal`

L'inverse de la prévision : étant donné un objectif connu, que faut-il pour l'atteindre ?

<PluginLab feature="goalseek" />

```ts
requiredGrowth(current, target, periods);   // constant % per period (compounding) to reach target
requiredRunRate(current, target, periods);  // constant additive amount per period to reach target
const pace = pacingToGoal(cumulative, target, periodsElapsed, periodsTotal);
// pace → { projected, attainmentPct, onTrack, requiredRunRate }
```

| Fonction | Signature | Retourne |
| --- | --- | --- |
| `requiredGrowth` | `(current, target, periods) => number` | Croissance multiplicative par période `g` telle que `current*(1+g)**periods === target`. `0` si `current <= 0` ou `periods <= 0`. |
| `requiredRunRate` | `(current, target, periods) => number` | Incrément additif par période `(target - current) / periods`. |
| `pacingToGoal` | `(cumulative, target, periodsElapsed, periodsTotal) => Pacing` | Projette le rythme actuel sur toute la fenêtre : `{ projected, attainmentPct, onTrack, requiredRunRate }`. |

Tout ceci est de l'arithmétique pure - pas de DOM, pas de dépendances, pas de hasard (sauf le Monte Carlo à graine).

**[guide Insights](/fr/guide/insights#more-from-the-toolbox)**
