---
title: API Sankey
---

# API Sankey

Các luồng giữa các nút được bố trí theo cột, với độ dày dải tỷ lệ với giá trị luồng (xây dựng trên d3-sankey) - xem **[bản demo Sankey](/vi/charts/sankey)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/sankey-chart";
// <michi-vz-sankey-chart> is now defined
```

```ts [Vanilla JS]
import { mountSankeyChart } from "@michi-vz/core";

const chart = mountSankeyChart(el, props);
```

:::

## Props

<PropsTable chart="sankey-chart" />

::: tip Dữ liệu là hai mảng
Khác với các biểu đồ khác, Sankey nhận `nodes` (`{ id, label?, color? }[]`) và `links` (`{ source, target, value }[]`) thay vì một `dataSet` duy nhất.
:::

## Events

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng cung cấp tương đương qua các callback `on*` trong bảng ở trên):

| Event | Detail | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | khi trạng thái tô sáng hover thay đổi (id của nút, hoặc source + target của một liên kết) |
| `michi-vz:colormapping` | `Record<string, string>` | khi một color mapping được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | khi dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | khi phát hiện cảnh báo về dữ liệu đầu vào (ví dụ một liên kết trỏ đến một nút không xác định) |

## getContext()

`mountSankeyChart(el, props).getContext()` trả về một **`SankeyChartContext`** không phụ thuộc bộ dựng: các `nodes` (id / label / color / value / độ sâu cột), các `links` (source / target / value / color), số liệu thống kê tóm tắt (số lượng nút & liên kết, số lượng cột, tổng luồng, liên kết lớn nhất, nút bận rộn nhất), một bản tóm tắt ngôn ngữ tự nhiên có tính xác định, và một bảng a11y liệt kê các luồng. Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Source

Các prop được định kiểu là [`SankeyChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
