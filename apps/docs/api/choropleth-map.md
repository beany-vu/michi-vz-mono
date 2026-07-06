---
title: Choropleth Map API
---

# Choropleth Map API

A world/region choropleth: your own GeoJSON, shaded by a threshold colour scale or an explicit category map - see the **[Choropleth Map demo](/charts/choropleth-map)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/choropleth-map-chart";
// <michi-vz-choropleth-map-chart> is now defined
```

```ts [Vanilla JS]
import { mountChoroplethMapChart } from "@michi-vz/core";

const chart = mountChoroplethMapChart(el, props);
```

:::

## Props

<PropsTable chart="choropleth-map-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected (unmatched dataSet ids, features without ids, invalid geometry) |

## getContext()

`mountChoroplethMapChart(el, props).getContext()` returns a renderer-agnostic **`ChoroplethMapChartContext`**: `stats.featureCount` / `matchedCount` / `unmatchedCount` / `valueDomain` / `lowest` / `highest`, a `regions[]` array (one row per feature: `id`, `label`, `value?`, `color`, `matched`), the resolved `projection` name, a deterministic natural-language `summary`, and an `a11yTable` listing every region + value + matched flag. See [LLM context](/guide/llm-context).

## Source

Props are typed as [`ChoroplethMapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
