---
title: Anomaly API
---

# Anomaly API

Flags the points that do not belong, marking them on the chart and noting them in the summary; for the story and live demos, see the **[Insights guide](/guide/insights)**.

## Import

```ts
import { anomaly, detectAnomalies } from "@michi-vz/insights/anomaly";
```

## Signature & options

`anomaly(options?)` returns a plugin; its `use()` marks outliers on-chart and notes them in the summary. `detectAnomalies(values: number[], options?)` returns `{ method, anomalies, threshold }`, where `anomalies` is an array of `{ index, value, score, kind }`.

Both accept the same options:

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `method` | `"zscore"` or `"iqr"` or `"forecast"` | `"zscore"` | Detection strategy. `"zscore"` flags points far from the mean, `"iqr"` flags points outside the interquartile fences, and `"forecast"` flags points outside the prediction band. |
| `threshold` | `number` | `~3` for `zscore`, `~1.5` for `iqr` | The z cutoff for `"zscore"` or the IQR `k` multiplier for `"iqr"`. Optional. |
| `target` | `string` or `string[]` | all series | Restrict detection to these series. Optional. |

## Example

```ts
import { anomaly, detectAnomalies } from "@michi-vz/insights/anomaly";

// Standalone detection: flags the 50.
const result = detectAnomalies([10, 11, 9, 10, 50, 11]);
// result.anomalies -> [{ index: 4, value: 50, score, kind }]

// As a chart plugin, using the IQR method.
chart.use(anomaly({ method: "iqr" }));
```

**[Insights guide](/guide/insights)**
