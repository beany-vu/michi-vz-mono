---
title: Forecast extras API - seizoensinvloed, changepoints, Monte Carlo, doel-benadering
---

# Forecast extras: seizoensinvloed, changepoints, Monte Carlo & doel-benadering

Naast de [`forecast()`-plugin](/nl/api/insights/forecast) bevat het `@michi-vz/insights/forecast`-subpad
een set pure, deterministische helpers die werken op een gewone `number[]` - geen grafiek vereist. Elk is
een naamgegeven, klassieke methode; voor het verhaal en de demo's, zie de **[Insights-gids](/nl/guide/insights#more-from-the-toolbox)**.

## Import

```ts
import {
  decompose, detectPeriod,          // seasonality
  detectChangepoints,               // regime shifts
  monteCarloForecast,               // simulation
  requiredGrowth, requiredRunRate, pacingToGoal, // goal-seek
} from "@michi-vz/insights/forecast";
```

## Seizoensinvloed: `decompose` / `detectPeriod`

Klassieke additieve decompositie splitst een reeks op in een gladde trend, een herhalende seizoenscomponent
en het overblijvende residu (`values = trend + seasonal + residual`). `detectPeriod` vindt de cycluslengte
zelfstandig via autocorrelatie.

<PluginLab feature="seasonal" />

```ts
const period = detectPeriod(values);            // e.g. 4 (quarterly), or 1 if not clearly periodic
const { trend, seasonal, residual } = decompose(values, period);
```

| Functie | Signatuur | Retourneert |
| --- | --- | --- |
| `detectPeriod` | `(values: number[], maxPeriod?: number) => number` | Dominante periode (lag met de hoogste autocorrelatie); `1` wanneer er geen duidelijke cyclus is. `maxPeriod` standaard `min(floor(n/2), 24)`. |
| `decompose` | `(values: number[], period?: number) => Decomposition` | `{ trend, seasonal, residual, period }` - elk een array van dezelfde lengte als `values`. `period` standaard `detectPeriod(values)`. |

Een kleine standaarddeviatie van het residu betekent dat trend + seizoen bijna alle beweging verklaren - oftewel
hoe je echte groei scheidt van "het is weer december."

## Changepoints: `detectChangepoints`

Vindt de indices waar de helling van de trend structureel verschuift (een OLS-lijn wordt aan weerszijden van elke
kandidaat-splitsing gefit; lokale maxima van `|slopeAfter - slopeBefore|` boven een drempel worden behouden).

<PluginLab feature="changepoints" />

```ts
const points = detectChangepoints(values, { minSegment: 3 });
// → [{ index, slopeBefore, slopeAfter, delta }, ...]
```

| Optie | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `minSegment` | `number` | `3` | Minimum aantal punten aan elke kant van een splitsing (ook de minimale afstand tussen twee changepoints). |
| `threshold` | `number` | standaarddeviatie van de helling-deltacurve | Minimale buigsterkte om een splitsing te laten meetellen; de standaardwaarde schaalt mee met de reeks. |

Elk `Changepoint` is `{ index, slopeBefore, slopeAfter, delta }`, waarbij `index` het begin van het "na"-segment
markeert.

## Simulatie: `monteCarloForecast`

Voert vele gesimuleerde toekomsten uit rond de puntvoorspelling (elke stap verstoord door Gaussische restruis
die groeit met `sqrt(step)`), en rapporteert vervolgens het gemiddelde pad, een empirische band en
overschrijdingskansen. Deterministisch via een geseede PRNG - dezelfde `seed` speelt altijd hetzelfde af.

<PluginLab feature="montecarlo" />

```ts
const mc = monteCarloForecast(values, { horizon: 4, runs: 500, seed: 1, level: 0.95 });
mc.predictions; // mean path (length = horizon)
mc.lower; mc.upper; // band edges per step
mc.probabilityAbove(target); // fraction of runs finishing strictly above `target`
mc.probabilityBelow(target);
```

| Optie | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `horizon` | `number` | (vereist) | Aantal stappen om vooruit te simuleren. |
| `runs` | `number` | `500` | Aantal gesimuleerde toekomsten. |
| `seed` | `number` | `1` | PRNG-seed voor reproduceerbaarheid. |
| `level` | `number` | `0.95` | Centrale waarschijnlijkheidsmassa die binnen de band wordt gehouden. |
| `method` | `ForecastMethod` | `"holt-winters"` | Model gebruikt voor het middenpad. |

## Doel-benadering: `requiredGrowth` / `requiredRunRate` / `pacingToGoal`

Het omgekeerde van voorspellen: gegeven een bekend doel, wat is er nodig om het te bereiken?

<PluginLab feature="goalseek" />

```ts
requiredGrowth(current, target, periods);   // constant % per period (compounding) to reach target
requiredRunRate(current, target, periods);  // constant additive amount per period to reach target
const pace = pacingToGoal(cumulative, target, periodsElapsed, periodsTotal);
// pace → { projected, attainmentPct, onTrack, requiredRunRate }
```

| Functie | Signatuur | Retourneert |
| --- | --- | --- |
| `requiredGrowth` | `(current, target, periods) => number` | Multiplicatieve groei `g` per periode zodat `current*(1+g)**periods === target`. `0` wanneer `current <= 0` of `periods <= 0`. |
| `requiredRunRate` | `(current, target, periods) => number` | Additieve toename per periode `(target - current) / periods`. |
| `pacingToGoal` | `(cumulative, target, periodsElapsed, periodsTotal) => Pacing` | Projecteert het huidige tempo over het volledige venster: `{ projected, attainmentPct, onTrack, requiredRunRate }`. |

Dit alles is pure rekenkunde - geen DOM, geen dependencies, geen willekeur (behalve de geseede Monte Carlo).

**[Insights-gids](/nl/guide/insights#more-from-the-toolbox)**
