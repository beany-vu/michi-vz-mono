---
title: Fountain (Jet d'Eau) API
---

# Fountain (Jet d'Eau) API

One number per column (the big dot), the real range around it (the fountain, from `low` to `high`) and the measurements themselves (the small dots), all on one y-axis. Categorical x = snapshot; temporal or numeric x = trend. See the **[Fountain demo](/charts/fountain)** and its [reading key](/charts/fountain#how-to-read-it).

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

```ts [React]
import { FountainChart } from "@michi-vz/react/fountain-chart";
```

```ts [Vue]
import { FountainChart } from "@michi-vz/vue/fountain-chart";
```

```ts [Svelte]
import { fountainChart } from "@michi-vz/svelte/fountain-chart";
```

```ts [Angular]
import { bindChart, applyFountainChartProps } from "@michi-vz/angular/fountain-chart";
// needs CUSTOM_ELEMENTS_SCHEMA on the component that hosts <michi-vz-fountain-chart>
```

:::

## Props

<PropsTable chart="fountain-chart" />

::: tip Two modes, one data shape
Set `xAxisDataType: "band"` (or omit it) for **snapshot mode**: one column per `label`. Give a temporal or numeric `xAxisDataType` plus a `date` on each item for **trend mode**: the jets sit along the x-axis, and with one series a dashed line joins the big dots. A `forecast: true` item gets a dashed stem and outline, a lighter fill and a hollow big dot, with no small dots.
:::

### New in core 1.29 {#new-props}

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `showRange` | `boolean` | `true` | Draw the fountain, the range `[low, high]`. `false` draws the stem and the big dot only; the small dots hide too. |
| `showSamples` | `boolean` | `true` | Draw one small dot per sample, when items carry `samples`. |
| `showValueLabels` | `boolean` | `true` | Print under each x label: bold "usual 30", "&lt;low word&gt; 22", "&lt;high word&gt; 55", "only N &lt;sampleWord&gt;" under 10 samples, and per reference line with a `goodSide` a bold "17 of 20" plus its `countLabel`. |
| `drift` | `boolean` | `false` | The Geneva look: the top of every fountain bends the same way. It carries no data. |
| `yAxisTitle` | `string` | none | Title drawn rotated beside the y-axis, e.g. "minutes (higher = slower)". |
| `endLabels` | `[string, string]` | `["lowest", "highest"]` | Words for the low and the high end in the value labels and the tooltip. |
| `referenceLines` | `FountainReferenceLine[]` | none | Dashed lines in the theme's attention colour, labelled at the right end. See [below](#reference-line). |
| `labels` | `FountainLabels` | English | The chart's other words, for localisation. See [below](#labels). |
| `readingGuide` | `boolean \| string` | `false` | A key under the plot, wrapped between its rules (at each " · ") when it does not fit on one line. `true` prints the default, naming only the marks the chart draws (no small-dot rules without small dots, no "Tall fountain" without a fountain); a string replaces it. |
| `sampleWord` | `string` | `"measurements"` | Plural noun for the samples ("days", "orders"). Plural on purpose: there is no pluralising logic. |

`showTrendLine` now defaults per mode: `true` in trend mode with one series; `false` with several series, where one line would zig-zag between them, and in snapshot mode (set it `true` to join an ordered row of categories).

### Data item: `FountainDataItem` {#data-item}

| Field | Type | What it is |
| --- | --- | --- |
| `label` | `string` | The column (snapshot) or the series name (trend). Drives the colour and the `data-label` hook. |
| `code` | `string` | Optional stable id carried into the context; not displayed. |
| `value` | `number` | The big dot. Optional when `samples` are given: then their median. With no finite value and no samples the jet is skipped. |
| `low` | `number` | The base of the fountain. |
| `high` | `number` | The top of the fountain. |
| `spread` | `number` | Shorthand for an even range: `low = value - spread`, `high = value + spread`. |
| `samples` | `number[]` | Real measurements, one small dot each, drawn at their exact height inside the fountain. |
| `forecast` | `boolean` | A predicted period: dashed stem and outline, lighter fill, hollow big dot, no small dots and no counts. |
| `color` | `string` | Per-item colour. Resolution per jet: `colorsMapping[label]`, then `color`, then the label's palette slot. |
| `date` | `number \| string` | The x position in trend mode; an item without a usable date is skipped there. |
| `predicted` | `boolean` | Deprecated: use `forecast`. Still honoured. |
| `certainty` | `boolean` | Deprecated: `certainty: false` is `forecast: true`. Still honoured. |
| `density` | `number` | Deprecated and ignored (an `ignored-option` warning). |
| `lean` | `number` | Deprecated and ignored (an `ignored-option` warning). |

The range comes from the first of: `low`/`high`, then `spread`, then the lowest and highest sample; with none, the jet has no fountain. A missing end falls back along the same chain. Samples outside an explicit range, and a value outside the range, widen the range and send a warning. Negative values are allowed: the y domain includes 0 and every `low`, and the stem runs down from the baseline.

### Reference line: `FountainReferenceLine` {#reference-line}

| Field | Type | What it is |
| --- | --- | --- |
| `value` | `number` | Where the line sits, in y units. Always inside the automatic y domain. |
| `label` | `string` | Printed at the right end of the line (wrapped; the chart reserves right margin). |
| `goodSide` | `"below" \| "above"` | Which side is good. When set, every jet with samples counts them: "below" counts the samples at or below the line, "above" those at or above it. |
| `countLabel` | `string` | Words after the count, e.g. "on time", "passed". Default "below the line" or "above the line". |

### Words: `FountainLabels` {#labels}

| Field | Default | Where it shows |
| --- | --- | --- |
| `usual` | `"usual"` | Before the big dot's value: "usual 30". |
| `of` | `"of"` | Between a count and its total: "17 of 20". |
| `only` | `"only"` | Before a small sample count: "only 5 days". |
| `forecast` | `"forecast"` | After a forecast jet's x label and in its tooltip: "Fri (forecast)". |

## Theme tokens {#theme}

The chart reads these CSS custom properties from its host element (or any ancestor), in every renderer:

| Token | Default | What it colours |
| --- | --- | --- |
| `--michi-vz-surface` | `#fff` | The background the chart sits on: the thin ring round each small dot and the ring round a big dot, which keep them apart from the marks under them. On a dark theme, set it to your page's background. |
| `--michi-vz-attention` | `#c0392b` | The reference lines, their labels and the counts under the columns. |
| `--michi-vz-lake` | `#9cc3dd` | The band at 0 (the lake). |
| `--michi-vz-ink` | `currentColor` | The trend line, the bold "usual 30" line and the title. |
| `--michi-vz-muted` | `#666` | The other value labels, the y-axis title, the reading guide and the axis labels. |
| `--michi-vz-grid` | `lightgray` | The thin rule above the reading guide. |
| `--michi-vz-font-family`, `--michi-vz-font-size` | inherited, `12px` | Every word the chart prints. |

A forecast's hollow big dot is a ring with nothing painted inside (the marks under it are cut away), so it stays hollow on any background without a token.

```css
/* The charts on a dark page */
.dark .charts {
  --michi-vz-surface: #1b1b1f;
  --michi-vz-ink: #e3e3e3;
  --michi-vz-muted: #a0a0a0;
}
```

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | the hovered jet changes (its label) |
| `michi-vz:colormapping` | `Record<string, string>` | a colour mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected (see [Warnings](#warnings)) |

## getContext()

`mountFountainChart(el, props).getContext()` returns a renderer-agnostic **`FountainChartContext`**:

- **`mode`**: `"snapshot"` for a categorical (band) x, `"trend"` for a temporal or numeric x.
- **`xAxis`**: `{ type, domain }`, the column labels in snapshot mode or `[min, max]` in trend mode. **`yAxis`**: `{ domain }`.
- **`jets`**: one entry per drawn jet (in x order in trend mode):

| Field | What it is |
| --- | --- |
| `label`, `code`, `color` | The jet's label, its optional id and its resolved colour. |
| `value` | The big dot. |
| `low`, `high` | The base and the top of the fountain; `null` without a range. |
| `range` | `high - low`; `null` without a range. |
| `rangeRatio` | `range / \|value\|`: how big the range is next to the number. `null` when the value is 0 or there is no range. |
| `sampleCount` | Number of small dots. |
| `referenceCounts` | One `{ value, goodSide, count, total, countLabel }` per reference line with a `goodSide`; `[]` for a forecast or a jet without samples. |
| `predicted` | `true` for a forecast jet. |
| `xPosition` | The raw `date` in trend mode, `null` in snapshot mode. |
| `spread` | Deprecated: `(high - low) / 2`, 0 without a range. Use `range`. |
| `spreadRatio` | Deprecated: `spread / \|value\|`, 0 when not computable. Use `rangeRatio`. |
| `upperBound` | Deprecated: `high` (or the value without a range). Use `high`. |
| `lean` | Deprecated: always `null`. |

- **`stats`**:
  - `jetCount`: number of drawn jets.
  - `tallest`: `{ label, value }` of the largest value, or `null`.
  - `widestRange`: `{ label, range }` of the widest range, or `null` when no jet has one.
  - `frothiest`: deprecated. `{ label, spreadRatio }` of the jet with the largest `rangeRatio`. Use `widestRange` or `jets[].rangeRatio`.
  - `trendSlope`: least-squares slope of the values per period (trend mode, one series); otherwise `null`.
  - `valueRange`: `[min, max]` of the values, or `null`.
  - `predictedCount`: number of forecast jets.
- **`legendData`**: every label of the whole `dataSet` with its colour, in first-seen order; disabled labels stay, flagged `disabled: true`. In trend mode only when there is more than one series.
- **`summary`**: one sentence in plain words, e.g. `Fountain chart "How long is my commute, really?" with 4 jets. Highest usual value: Bus at 40. Widest range: Car, from 22 to 55.`
- **`a11yTable`**: headers `Label`, `Usual`, the two `endLabels`, `Samples`, and one column per reference line with a `goodSide` (headed by its `countLabel`, cells like `"17 of 20"`); trend mode adds `Period` first. A forecast jet's label gets "(forecast)" after it: its trend row reads `["Year 4", "Battery (forecast)", …]`.

See [LLM context](/guide/llm-context) for how to use the context in prompts and reports.

## Warnings {#warnings}

`onDataWarning` (and the `michi-vz:datawarning` event) receives `DataWarning[]`, each `{ type, message, label? }`. The chart never redraws data silently: every repair is reported.

| `type` | When | What the chart does |
| --- | --- | --- |
| `non-finite-value` | An item has no finite `value` and no samples, or some samples are not finite. | Skips the jet (it stays out of the stats), or drops those samples. A missing value with samples uses their median. |
| `range-excludes-value` | `low`/`high` (or `spread`) leave the value out. | Widens the range to include the value. |
| `sample-outside-range` | A sample lies outside an explicit range. | Widens the range to include it. |
| `inverted-range` | `low` is above `high`, or `spread` is negative. | Swaps the ends (uses the spread's size). |
| `missing-date` | Trend mode, but the item has no usable `date`. | Skips the item (the chart stays in trend mode). |
| `duplicate-date` | Two jets share one date in trend mode. | Draws them on top of each other. |
| `duplicate-label` | A label repeats in snapshot mode. | Its jets share one column. |
| `out-of-domain` | A value, range end or sample is outside a user `yAxisDomain`, or a reference line is. | Clamps the drawing to the plot; small dots and lines outside it are not drawn. |
| `ignored-option` | A removed prop is set, or an item carries `density` or `lean`. | Ignores it. |
| `empty-dataset` | The `dataSet` is empty. | Shows the no-data overlay ("No data available", your `noDataLabel`, or your own with `suppressDefaultOverlay`) instead of axes and marks. `isNodata: false` draws the empty axes. |
| `layout-overflow` | Each jet gets under 24 px, or the value labels do not fit (narrow columns, rotated x labels, jets sharing a column, or a chart too short for them). | Draws the jets anyway and leaves out the value labels that do not fit, the end words first. Widen the chart, show fewer jets or aggregate. |

## Deprecations {#deprecations}

All of these still work in core 1.29 and will be removed in a later release. See [Migrating from core 1.28](/charts/fountain#migrating).

- **Props, ignored with an `ignored-option` warning:** `style`, `frothLayers`, `bloomExponent`, `stemFraction`, `showDroplets`, `showMist`. On the web component, `fountainStyle` (`fountain-style`).
- **Item fields:** `predicted` and `certainty` are honoured; use `forecast`. `density` and `lean` are ignored with a warning.
- **Context fields:** `jets[].spread`, `jets[].spreadRatio`, `jets[].upperBound` and `jets[].lean` (always `null`); `stats.frothiest`. Use `range`, `rangeRatio`, `high` and `stats.widestRange`.

## Source

Props are typed as [`FountainChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
