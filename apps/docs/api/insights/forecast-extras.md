---
title: Forecast extras API - seasonality, changepoints, Monte Carlo, goal-seek
---

# Forecast extras: seasonality, changepoints, Monte Carlo & goal-seek

Beyond the [`forecast()` plugin](/api/insights/forecast), the `@michi-vz/insights/forecast` sub-path
ships a set of pure, deterministic helpers that work on a plain `number[]` - no chart required. Each is
a named, textbook method; for the story and demos, see the **[Insights guide](/guide/insights#more-from-the-toolbox)**.

## Import

```ts
import {
  decompose, detectPeriod,          // seasonality
  detectChangepoints,               // regime shifts
  monteCarloForecast,               // simulation
  requiredGrowth, requiredRunRate, pacingToGoal, // goal-seek
} from "@michi-vz/insights/forecast";
```

## Seasonality: `decompose` / `detectPeriod`

Classical additive decomposition splits a series into a smooth trend, a repeating seasonal component,
and the leftover residual (`values = trend + seasonal + residual`). `detectPeriod` finds the cycle
length on its own via autocorrelation.

<PluginLab feature="seasonal" />

```ts
const period = detectPeriod(values);            // e.g. 4 (quarterly), or 1 if not clearly periodic
const { trend, seasonal, residual } = decompose(values, period);
```

| Function | Signature | Returns |
| --- | --- | --- |
| `detectPeriod` | `(values: number[], maxPeriod?: number) => number` | Dominant period (lag with the highest autocorrelation); `1` when no clear cycle. `maxPeriod` defaults to `min(floor(n/2), 24)`. |
| `decompose` | `(values: number[], period?: number) => Decomposition` | `{ trend, seasonal, residual, period }` - each an array the length of `values`. `period` defaults to `detectPeriod(values)`. |

A small residual standard deviation means trend + season explain almost all of the movement - i.e. how
you separate real growth from "it's December again."

## Changepoints: `detectChangepoints`

Finds the indices where the trend's slope structurally shifts (an OLS line is fit either side of every
candidate split; local maxima of `|slopeAfter - slopeBefore|` above a threshold are kept).

<PluginLab feature="changepoints" />

```ts
const points = detectChangepoints(values, { minSegment: 3 });
// → [{ index, slopeBefore, slopeAfter, delta }, ...]
```

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `minSegment` | `number` | `3` | Minimum points each side of a split (also the minimum gap between two changepoints). |
| `threshold` | `number` | stdev of the slope-delta curve | Minimum bend strength for a split to count; the default scales with the series. |

Each `Changepoint` is `{ index, slopeBefore, slopeAfter, delta }`, where `index` starts the "after"
segment.

## Simulation: `monteCarloForecast`

Runs many simulated futures around the point forecast (each step perturbed by Gaussian residual noise
that grows with `sqrt(step)`), then reports the mean path, an empirical band, and exceedance
probabilities. Deterministic via a seeded PRNG - the same `seed` always replays.

<PluginLab feature="montecarlo" />

```ts
const mc = monteCarloForecast(values, { horizon: 4, runs: 500, seed: 1, level: 0.95 });
mc.predictions; // mean path (length = horizon)
mc.lower; mc.upper; // band edges per step
mc.probabilityAbove(target); // fraction of runs finishing strictly above `target`
mc.probabilityBelow(target);
```

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `horizon` | `number` | (required) | Steps to simulate forward. |
| `runs` | `number` | `500` | Number of simulated futures. |
| `seed` | `number` | `1` | PRNG seed for reproducibility. |
| `level` | `number` | `0.95` | Central probability mass kept inside the band. |
| `method` | `ForecastMethod` | `"holt-winters"` | Model used for the centre path. |

## Goal-seek: `requiredGrowth` / `requiredRunRate` / `pacingToGoal`

The inverse of forecasting: given a known target, what does it take to get there?

<PluginLab feature="goalseek" />

```ts
requiredGrowth(current, target, periods);   // constant % per period (compounding) to reach target
requiredRunRate(current, target, periods);  // constant additive amount per period to reach target
const pace = pacingToGoal(cumulative, target, periodsElapsed, periodsTotal);
// pace → { projected, attainmentPct, onTrack, requiredRunRate }
```

| Function | Signature | Returns |
| --- | --- | --- |
| `requiredGrowth` | `(current, target, periods) => number` | Per-period multiplicative growth `g` so `current*(1+g)**periods === target`. `0` when `current <= 0` or `periods <= 0`. |
| `requiredRunRate` | `(current, target, periods) => number` | Per-period additive increment `(target - current) / periods`. |
| `pacingToGoal` | `(cumulative, target, periodsElapsed, periodsTotal) => Pacing` | Projects the current run-rate over the full window: `{ projected, attainmentPct, onTrack, requiredRunRate }`. |

All of these are pure arithmetic - no DOM, no deps, no randomness (except the seeded Monte Carlo).

**[Insights guide](/guide/insights#more-from-the-toolbox)**
