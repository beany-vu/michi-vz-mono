---
title: API Biểu đồ khoảng
---

# API Biểu đồ khoảng

Tô đậm độ trải rộng thay vì chỉ một đường - API dành cho các dải min-max và hình nón dự báo. Xem **[bản demo Biểu đồ khoảng](/vi/charts/range)** để biết ví dụ và cách dùng.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/range-chart";
// <michi-vz-range-chart> is now defined
```

```ts [Vanilla JS]
import { mountRangeChart } from "@michi-vz/core";

const chart = mountRangeChart(el, props);
```

:::

## Props

<PropsTable chart="range-chart" />

## Events

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng cung cấp tương đương qua các callback `on*` trong bảng ở trên):

| Event | Detail | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | khi trạng thái tô sáng hover thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | khi một color mapping được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | khi dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | khi phát hiện cảnh báo về dữ liệu đầu vào |

## getContext()

`mountRangeChart(el, props).getContext()` trả về một **`RangeChartContext`** không phụ thuộc bộ dựng (số liệu thống kê có cấu trúc + một bản tóm tắt ngôn ngữ tự nhiên có tính xác định + một bảng a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Source

Các prop được định kiểu là [`RangeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
