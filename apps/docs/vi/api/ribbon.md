---
title: API Biểu đồ dải
---

# API Biểu đồ dải

Theo dõi một thành phần tự sắp xếp lại thứ hạng theo thời gian, từng danh mục được nối liền một lúc. Xem **[bản demo Biểu đồ dải](/vi/charts/ribbon)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/ribbon-chart";
// <michi-vz-ribbon-chart> is now defined
```

```ts [Vanilla JS]
import { mountRibbonChart } from "@michi-vz/core";

const chart = mountRibbonChart(el, props);
```

:::

## Props

<PropsTable chart="ribbon-chart" />

## Events

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng cung cấp tương đương qua các callback `on*` trong bảng ở trên):

| Event | Detail | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | khi trạng thái tô sáng hover thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | khi một color mapping được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | khi dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | khi phát hiện cảnh báo về dữ liệu đầu vào |

## getContext()

`mountRibbonChart(el, props).getContext()` trả về một **`RibbonChartContext`** không phụ thuộc bộ dựng (số liệu thống kê có cấu trúc + một bản tóm tắt ngôn ngữ tự nhiên có tính xác định + một bảng a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Source

Các prop được định kiểu là [`RibbonChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
