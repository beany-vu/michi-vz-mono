---
title: Fountain (Jet d'Eau) API
---

# Fountain (Jet d'Eau) API

One chart, two modes: apex height = value, blooming plume = uncertainty. Categorical x = snapshot/comparison; temporal or numeric x = trend - see the **[Fountain demo](/charts/fountain)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/fountain-chart";
// <michi-vz-fountain-chart> is now defined
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
```

:::

## Props

<PropsTable chart="fountain-chart" />

::: tip Two modes, one data shape
Set `xAxisDataType: "band"` (or omit it) for **Snapshot mode** - each item gets its own x-band, side by side. Provide a temporal or numeric `xAxisDataType` plus a `date` on each item for **Trend mode** - the jets are placed along the time axis and a trend line threads their apexes. A `predicted: true` item renders dashed with a frothier crown.
:::

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes (jet label) |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected (e.g. non-finite value or spread) |

## getContext()

`mountFountainChart(el, props).getContext()` returns a renderer-agnostic **`FountainChartContext`**:

- **`mode`** - `"snapshot"` for a categorical/band x, `"trend"` for a temporal/numeric x.
- **`jets`** - one entry per visible jet: `{ label, code?, color, value, spread, upperBound, spreadRatio, predicted, xPosition }`. `upperBound` = `value + spread`; `spreadRatio` = `spread / value` (relative uncertainty); `xPosition` is the raw date/number in trend mode, or `null` in snapshot mode.
- **`stats`** - summary object:
  - `jetCount` - number of visible jets.
  - `tallest` - `{ label, value }` of the highest jet, or `null` if empty.
  - `frothiest` - `{ label, spreadRatio }` of the most uncertain jet, or `null` if empty.
  - `trendSlope` - slope of a linear regression through the jet values by index in trend mode; `null` in snapshot mode.
  - `valueRange` - `[min, max]` of the jet values, or `null` if empty.
  - `predictedCount` - number of forecast jets.

See [LLM context](/guide/llm-context) for how to use the context in prompts and reports.

## Source

Props are typed as [`FountainChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
