---
title: API Biểu đồ vòng cung
---

# API Biểu đồ vòng cung

Các vòng đồng tâm, từ ngoài vào trong, mỗi vòng quét `value / max` của một vòng tròn đầy đủ trên rãnh nền - xem **[demo Biểu đồ vòng cung](/vi/charts/gauge)**.

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

Web component phát các `CustomEvent` nổi bọt sau (engine cung cấp tương tự qua các callback `on*` trong bảng trên):

| Event | Detail | Fires when |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | hover highlight changes |
| `michi-vz:colormapping` | `Record<string, string>` | a color mapping is generated |
| `michi-vz:dataprocessed` | `ChartContext` | data is (re)processed |
| `michi-vz:datawarning` | `DataWarning[]` | input warnings are detected |

## getContext()

`mountGaugeChart(el, props).getContext()` trả về một **`GaugeChartContext`** độc lập trình kết xuất: thang `max`, các `rings` (label / value / fraction / index, từ ngoài vào trong), thống kê tóm tắt (số vòng, vòng lớn nhất), một bản tóm tắt ngôn ngữ tự nhiên xác định và một bảng a11y. Xem [Ngữ cảnh LLM](/vi/guide/llm-context).

## Source

Props được định kiểu [`GaugeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
