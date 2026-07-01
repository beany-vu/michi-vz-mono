---
title: Line Chart API
---

# Line Chart API

Everything you need to wire up a line chart in code; for the story and demos, see the **[Line Chart demo](/charts/line)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/line-chart";
// <michi-vz-line-chart> is now defined
```

```ts [Vanilla JS]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, props);
```

:::

## Props

<PropsTable chart="line-chart" />

## Grid and axis display

Four props control the y-axis tick density and grid line rendering:

| Prop | Default | Notes |
| --- | --- | --- |
| `yTicks` | `10` | Approximate number of y-axis ticks. The legacy default was 10; set lower (e.g. `5`) for a sparser axis. |
| `showGridLines` | `true` | Horizontal dashed grid lines at each y tick. |
| `showVerticalGridLines` | `false` | Vertical dashed grid lines at each x tick. The legacy chart drew none; opt in only when the extra guides help readability. |
| `highlightZeroLine` | `true` | Draws the y=0 line as a solid stroke (coloured by `--michi-vz-zero-line`, falling back to the grid colour) rather than a regular dashed tick. Useful when a dataset spans positive and negative values. |

## Loading and no-data state

The engine manages a `data-mv-state` attribute on the host element with three values - `"loading"`, `"nodata"`, and `"ready"` - and shows built-in overlays for the first two unless you opt out.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `isLoading` | `boolean` | `false` | Shows the `.mv-loading` overlay and bypasses the no-data check entirely. |
| `isNodata` | `boolean \| (dataSet) => boolean` | - | Overrides the default predicate (empty `dataSet` or every series has zero points). Pass `false` to force the chart to render even when data looks empty. |
| `noDataLabel` | `string` | - | Text shown inside the default `.mv-nodata` overlay. Ignored when `suppressDefaultOverlay` is true. |
| `suppressDefaultOverlay` | `boolean` | `false` | Prevents the engine from injecting its own loading/no-data node. Use this when a framework wrapper (e.g. the `@michi-vz/react` `LineChart`) renders `isLoadingComponent` / `isNodataComponent` as a React overlay instead. The host is never unmounted - the overlay is layered on top. |

::: tip React wrapper behaviour
`@michi-vz/react`'s `LineChart` automatically sets `suppressDefaultOverlay` and renders `isLoadingComponent` / `isNodataComponent` as a positioned React node above the chart host. The chart DOM is always mounted, so `isNodataComponent` still fires on empty data even without a custom predicate.
:::

## Font family

`fontFamily` sets the CSS custom property `--michi-vz-font-family` on the host element, which is read by both the SVG text renderer and the canvas `getComputedStyle` probe. The family must already be loaded by the page - no font embedding is performed.

## ChartContext / legendData

`onChartDataProcessed` receives a `LineChartContext` that extends `BaseChartContext`. The base now carries a `legendData` field:

```ts
interface LegendItem {
  label: string;         // series label as it appears in dataSet
  color: string;         // resolved colour at the time of processing
  order: number;         // appearance order (legend slot index)
  disabled?: boolean;    // true when the label is currently hidden
  dataLabelSafe?: string; // sanitizeForClassName(label) - the CSS hook the canvas colour probe matches
}

interface BaseChartContext {
  // ... existing fields ...
  legendData?: LegendItem[]; // populated by LineChart; treat absence as []
}
```

`legendData` is the canonical payload for consumer colour authorities. A framework wrapper that drives its own colour CSS (e.g. thd MonitorV2's `useChartUtils`) reads `legendData[].{label, dataLabelSafe, color, disabled}` from each `onChartDataProcessed` call and emits per-label `stroke`/`fill` rules targeting the `data-label-safe` attribute. This replaces the need to cross-reference `colorsMapping` with the series order.

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountLineChart(el, props).getContext()` returns a renderer-agnostic **`LineChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`LineChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
