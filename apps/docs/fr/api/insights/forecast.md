---
title: API Forecast
---

# API Forecast

Un plugin qui transforme n'importe quel graphique temporel en prévision, en projetant les pas futurs avec une bande de confiance ; pour l'histoire complète, voir le **[guide Insights](/fr/guide/insights)**.

Essayez-le - activez la prévision, sa bande et la narration :

<InsightsDemo feature="forecast" />

## Import

```ts
import { forecast } from "@michi-vz/insights/forecast";
```

`forecast(options?)` retourne un plugin que vous passez dans les options de montage du graphique. Il fonctionne sur les graphiques Line, Fan, Range, Area, Vertical-Stack-Bar, Ribbon et Bar-Bell.

```ts
mountLineChart(el, props, { plugins: [forecast({ horizon: 4 })] });
```

## Signature et options

| Nom | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `method` | `"holt-winters"` ou `"linear"` (lazy `"arima"`) | `"holt-winters"` | Modèle de prévision utilisé pour projeter les pas futurs. |
| `horizon` | `number` | `4` | Nombre de pas futurs à prévoir. |
| `level` | `number` | `0.95` | Niveau de confiance de la bande de prédiction. |
| `levels` | `number[]` | optionnel | Niveaux de bande imbriqués supplémentaires pour un graphique en éventail. |
| `target` | `string` ou `string[]` | toutes | Restreint la prévision à ces étiquettes de série. |
| `scenarios` | `Array<{ name: string; growth: number }>` | optionnel | Lignes hypothétiques dessinées à partir de taux de croissance personnalisés. |
| `trendline` | `boolean` | `false` | Superpose une ligne de régression. |
| `threshold` | `{ value: number; label?: string }` | optionnel | Ligne de référence plus un "point de chute" projeté. |
| `onThresholdBreach` | `(b) => void` | optionnel | Se déclenche quand la prévision est projetée pour franchir le seuil. |
| `zone` | `boolean` | `true` | Ombre la région de prévision pour distinguer prédiction et valeurs réelles. |

Également exporté depuis ce sous-chemin : `forecastFan(history, options?, label?)`, `computeForecast`, `decompose`, `detectPeriod`, `detectChangepoints`, `monteCarloForecast`, `requiredGrowth`, `requiredRunRate`, `pacingToGoal`, et `FORECASTABLE_CHARTS`.

## Exemple

```ts
import { mountLineChart } from "@michi-vz/core";
import { forecast } from "@michi-vz/insights/forecast";

mountLineChart(el, props, {
  plugins: [
    forecast({
      method: "holt-winters",
      horizon: 4,
      threshold: { value: 200, label: "Target" },
      zone: true,
    }),
  ],
});
```

**[guide Insights](/fr/guide/insights)**
