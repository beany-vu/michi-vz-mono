---
title: API Treemap
---

# API Treemap

Các ô phân cấp có kích thước theo giá trị, mỗi ô có thể tùy chọn chia thành hai phần được đặt tên (ví dụ: đã hiện thực hóa so với chưa khai thác), kèm phương án dự phòng xếp chồng thân thiện với di động - xem **[bản demo Treemap](/vi/charts/treemap)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/treemap-chart";
// <michi-vz-treemap-chart> is now defined
```

```ts [Vanilla JS]
import { mountTreemapChart } from "@michi-vz/core";

const chart = mountTreemapChart(el, props);
```

:::

## Props

<PropsTable chart="treemap-chart" />

## Events

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng cung cấp tương đương qua các callback `on*` trong bảng ở trên):

| Event | Detail | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | khi trạng thái tô sáng hover thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | khi một color mapping được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | khi dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | khi phát hiện cảnh báo về dữ liệu đầu vào |

## getContext()

`mountTreemapChart(el, props).getContext()` trả về một **`TreemapChartContext`** không phụ thuộc bộ dựng: các `leaves` phẳng (value / partial / remainder / percent / path), `layout` đã được phân giải, `splitLabels`, `depth` lồng nhau, số liệu thống kê tóm tắt (tổng cộng, tổng theo từng phần, leaf lớn nhất, remainder lớn nhất), một bản tóm tắt ngôn ngữ tự nhiên có tính xác định, và một bảng a11y. Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Source

Các prop được định kiểu là [`TreemapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
