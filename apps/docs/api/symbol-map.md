---
title: Symbol Map API
---

# Symbol Map API

A force-de-overlapped symbol/bubble map: you supply lng/lat per item, a one-shot force simulation pulls overlapping circles apart - see the **[Symbol Map demo](/charts/symbol-map)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/symbol-map-chart";
// <michi-vz-symbol-map-chart> is now defined
```

```ts [Vanilla JS]
import { mountSymbolMapChart } from "@michi-vz/core";

const chart = mountSymbolMapChart(el, props);
```

:::

## Props

<PropsTable chart="symbol-map-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected (missing/invalid lng-lat, negative values, duplicate ids) |

## getContext()

`mountSymbolMapChart(el, props).getContext()` returns a renderer-agnostic **`SymbolMapChartContext`**: `stats.locatedCount` / `visibleCount` / `hiddenCount` (excluded by `radiusVisibleMin`) / `invalidCount` (dropped for bad coordinates) / `valueDomain` / `min` / `max`, a `symbols[]` array (one row per visible item: `id`, `label`, `value`, `valueSecond`, `radius`, `radiusSecond`, `color`), the resolved `projection` name, a deterministic natural-language `summary`, and an `a11yTable`. See [LLM context](/guide/llm-context).

## Source

Props are typed as [`SymbolMapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
