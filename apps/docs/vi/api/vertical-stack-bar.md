---
title: API Biểu đồ cột chồng dọc
---

# API Biểu đồ cột chồng dọc

Cho thấy mỗi danh mục được cấu thành từ những gì, từng phân đoạn một, với các phần bị thiếu được gắn cờ cảnh báo thay vì bị bỏ qua - xem **[bản demo Biểu đồ cột chồng dọc](/vi/charts/vertical-stack-bar)**.

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

:::

## Props

<PropsTable chart="vertical-stack-bar-chart" />

## Events

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng cung cấp tương đương qua các callback `on*` trong bảng ở trên):

| Event | Detail | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | khi trạng thái tô sáng hover thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | khi một color mapping được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | khi dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | khi phát hiện cảnh báo về dữ liệu đầu vào |

## getContext()

`mountVerticalStackBarChart(el, props).getContext()` trả về một **`VerticalStackBarChartContext`** không phụ thuộc bộ dựng (số liệu thống kê có cấu trúc + một bản tóm tắt ngôn ngữ tự nhiên có tính xác định + một bảng a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Source

Các prop được định kiểu là [`VerticalStackBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
