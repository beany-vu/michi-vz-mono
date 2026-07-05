---
title: Anomaly API
---

# Anomaly API

Markeert de punten die er niet bij horen, geeft ze aan op de grafiek en vermeldt ze in de samenvatting; voor het volledige verhaal, zie de **[Insights-gids](/nl/guide/insights)**.

Probeer het - de uitschieter wordt op de grafiek gemarkeerd en genoemd in de samenvatting:

<InsightsDemo feature="anomaly" />

## Import

```ts
import { anomaly, detectAnomalies } from "@michi-vz/insights/anomaly";
```

## Signatuur & opties

`anomaly(options?)` retourneert een plugin; de `use()`-methode ervan markeert uitschieters op de grafiek en vermeldt ze in de samenvatting. `detectAnomalies(values: number[], options?)` retourneert `{ method, anomalies, threshold }`, waarbij `anomalies` een array is van `{ index, value, score, kind }`.

Beide accepteren dezelfde opties:

| Optie | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `method` | `"zscore"` of `"iqr"` of `"forecast"` | `"zscore"` | Detectiestrategie. `"zscore"` markeert punten ver van het gemiddelde, `"iqr"` markeert punten buiten de interkwartielgrenzen, en `"forecast"` markeert punten buiten de voorspellingsband. |
| `threshold` | `number` | `~3` voor `zscore`, `~1.5` voor `iqr` | De z-afkapwaarde voor `"zscore"` of de IQR-`k`-vermenigvuldiger voor `"iqr"`. Optioneel. |
| `target` | `string` of `string[]` | alle series | Beperk de detectie tot deze series. Optioneel. |

## Voorbeeld

```ts
import { anomaly, detectAnomalies } from "@michi-vz/insights/anomaly";

// Standalone detection: flags the 50.
const result = detectAnomalies([10, 11, 9, 10, 50, 11]);
// result.anomalies -> [{ index: 4, value: 50, score, kind }]

// As a chart plugin, using the IQR method.
chart.use(anomaly({ method: "iqr" }));
```

**[Insights-gids](/nl/guide/insights)**
