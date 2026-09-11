---
title: API Biểu đồ phân tán
---

# API Biểu đồ phân tán

Dùng biểu đồ này khi câu hỏi là "hai con số này có liên quan với nhau không?" - các prop và engine ở bên dưới; câu trả lời nằm ở **[bản demo Biểu đồ phân tán](/vi/charts/scatter)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/scatter-chart";
// <michi-vz-scatter-chart> is now defined
```

```ts [Vanilla JS]
import { mountScatterChart } from "@michi-vz/core";

const chart = mountScatterChart(el, props);
```

```ts [React]
import { ScatterChart } from "@michi-vz/react/scatter-chart";
```

```ts [Vue]
import { ScatterChart } from "@michi-vz/vue/scatter-chart";
```

```ts [Svelte]
import { scatterChart } from "@michi-vz/svelte/scatter-chart";
```

```ts [Angular]
import { bindChart, applyScatterChartProps } from "@michi-vz/angular/scatter-chart";
// needs CUSTOM_ELEMENTS_SCHEMA on the component that hosts <michi-vz-scatter-chart>
```

:::

## Props

<PropsTable chart="scatter-chart" />

## Events

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng cung cấp tương đương qua các callback `on*` trong bảng ở trên):

| Event | Detail | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | khi trạng thái tô sáng hover thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | khi một color mapping được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | khi dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | khi phát hiện cảnh báo về dữ liệu đầu vào |

## getContext()

`mountScatterChart(el, props).getContext()` trả về một **`ScatterChartContext`** không phụ thuộc bộ dựng (số liệu thống kê có cấu trúc + một bản tóm tắt ngôn ngữ tự nhiên có tính xác định + một bảng a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Source

Các prop được định kiểu là [`ScatterChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
