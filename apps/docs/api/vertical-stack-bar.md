---
title: Vertical Stack Bar API
---

# Vertical Stack Bar API

Show what each category is built from, segment by segment, with missing parts flagged instead of dropped - see the **[Vertical Stack Bar demo](/charts/vertical-stack-bar)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/vertical-stack-bar-chart";
// <michi-vz-vertical-stack-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountVerticalStackBarChart } from "@michi-vz/core";

const chart = mountVerticalStackBarChart(el, props);
```

```ts [React]
import { VerticalStackBarChart } from "@michi-vz/react/vertical-stack-bar-chart";
```

```ts [Vue]
import { VerticalStackBarChart } from "@michi-vz/vue/vertical-stack-bar-chart";
```

```ts [Svelte]
import { verticalStackBarChart } from "@michi-vz/svelte/vertical-stack-bar-chart";
```

```ts [Angular]
import { bindChart, applyVerticalStackBarChartProps } from "@michi-vz/angular/vertical-stack-bar-chart";
// needs CUSTOM_ELEMENTS_SCHEMA on the component that hosts <michi-vz-vertical-stack-bar-chart>
```

:::

## Props

<PropsTable chart="vertical-stack-bar-chart" />

## Events

The web component dispatches these bubbling `CustomEvent`s (the engine exposes the same via the `on*` callbacks in the table above):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountVerticalStackBarChart(el, props).getContext()` returns a renderer-agnostic **`VerticalStackBarChartContext`** (structured stats + a deterministic natural-language summary + an a11y table). See [LLM context](/guide/llm-context).

## Source

Props are typed as [`VerticalStackBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
