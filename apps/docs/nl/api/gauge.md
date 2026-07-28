---
title: Meter (ringen) API
---

# Meter (ringen) API

Concentrische ringen, van buiten naar binnen, die elk `value / max` van een volledige cirkel over een achtergrondspoor bestrijken - zie de **[Meter-demo](/nl/charts/gauge)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/gauge-chart";
// <michi-vz-gauge-chart> is now defined
```

```ts [Vanilla JS]
import { mountGaugeChart } from "@michi-vz/core";

const chart = mountGaugeChart(el, props);
```

:::

## Props

<PropsTable chart="gauge-chart" />

## Events

Het web component verstuurt deze bubbelende `CustomEvent`s (de engine biedt dezelfde via de `on*`-callbacks in de tabel hierboven):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountGaugeChart(el, props).getContext()` geeft een renderer-onafhankelijke **`GaugeChartContext`**: de `max`-schaal, de `rings` (label / value / fraction / index, van buiten naar binnen), statistieken (aantal ringen, grootste ring), een deterministische samenvatting in natuurlijke taal en een a11y-tabel. Zie [LLM-context](/nl/guide/llm-context).

## Source

Props zijn getypeerd als [`GaugeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
