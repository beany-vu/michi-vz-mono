---
title: Validate API
---

# Validate API

Surfaces bad data and paints the offending points red on the chart; for the story and live demos, see the **[Insights guide](/guide/insights)**.

## Import

```ts
import { validate, validateSeries, invalidPoints } from "@michi-vz/insights/validate";
```

## Signature & options

`validate(options?)` returns a plugin that reports problems via `onDataWarning` and, when highlighting is on, draws a red marker on each invalid point.

| Name | Type | Default | What it does |
| --- | --- | --- | --- |
| `options.highlight` | `boolean` | `true` | Highlight invalid points on the chart with a red marker. Set to `false` for warnings only. |

Two helpers run the same checks without a chart:

| Function | Returns | What it does |
| --- | --- | --- |
| `validateSeries(series)` | `DataWarning[]` | Reports dataset-level problems: `non-finite-value`, `duplicate-date`, `non-monotonic-date`, and `empty-dataset`. |
| `invalidPoints(series)` | `Array<{ index, date, value, kind }>` | Lists each bad point, where `kind` is `"non-finite"`, `"duplicate-date"`, or `"non-monotonic"`. |

This is distinct from `highlightItems`, which highlights a whole series; `validate` highlights the bad points instead.

## Example

```ts
import { validate } from "@michi-vz/insights/validate";

// Warn via onDataWarning and mark bad points red.
chart.use(validate());

// Warnings only, no red markers.
chart.use(validate({ highlight: false }));
```

**[Insights guide](/guide/insights)**
