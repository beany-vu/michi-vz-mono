---
title: API Anomaly
---

# API Anomaly

Signale les points qui n'appartiennent pas à l'ensemble, en les marquant sur le graphique et en les mentionnant dans le résumé ; pour l'histoire complète, voir le **[guide Insights](/fr/guide/insights)**.

Essayez-le - la valeur aberrante est signalée sur le graphique et mentionnée dans le résumé :

<InsightsDemo feature="anomaly" />

## Import

```ts
import { anomaly, detectAnomalies } from "@michi-vz/insights/anomaly";
```

## Signature et options

`anomaly(options?)` retourne un plugin ; son `use()` marque les valeurs aberrantes sur le graphique et les mentionne dans le résumé. `detectAnomalies(values: number[], options?)` retourne `{ method, anomalies, threshold }`, où `anomalies` est un tableau de `{ index, value, score, kind }`.

Les deux acceptent les mêmes options :

| Option | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `method` | `"zscore"` ou `"iqr"` ou `"forecast"` | `"zscore"` | Stratégie de détection. `"zscore"` signale les points éloignés de la moyenne, `"iqr"` signale les points hors des bornes interquartiles, et `"forecast"` signale les points hors de la bande de prédiction. |
| `threshold` | `number` | `~3` pour `zscore`, `~1.5` pour `iqr` | Le seuil z pour `"zscore"` ou le multiplicateur `k` de l'IQR pour `"iqr"`. Optionnel. |
| `target` | `string` ou `string[]` | toutes les séries | Restreint la détection à ces séries. Optionnel. |

## Exemple

```ts
import { anomaly, detectAnomalies } from "@michi-vz/insights/anomaly";

// Standalone detection: flags the 50.
const result = detectAnomalies([10, 11, 9, 10, 50, 11]);
// result.anomalies -> [{ index: 4, value: 50, score, kind }]

// As a chart plugin, using the IQR method.
chart.use(anomaly({ method: "iqr" }));
```

**[guide Insights](/fr/guide/insights)**
