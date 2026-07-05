---
title: API Biểu đồ tròn / Vành khuyên
---

# API Biểu đồ tròn / Vành khuyên

Các lát được chia theo tỷ phần trong tổng thể, với chế độ vành khuyên chỉ cách một prop (`innerRadiusRatio`) - xem **[bản demo Biểu đồ tròn / Vành khuyên](/vi/charts/pie)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/pie-chart";
// <michi-vz-pie-chart> is now defined
```

```ts [Vanilla JS]
import { mountPieChart } from "@michi-vz/core";

const chart = mountPieChart(el, props);
```

:::

## Props

<PropsTable chart="pie-chart" />

## Events

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng cung cấp tương đương qua các callback `on*` trong bảng ở trên):

| Event | Detail | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | khi trạng thái tô sáng hover thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | khi một color mapping được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | khi dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | khi phát hiện cảnh báo về dữ liệu đầu vào |

## getContext()

`mountPieChart(el, props).getContext()` trả về một **`PieChartContext`** không phụ thuộc bộ dựng: `mode` (`"pie"` hoặc `"donut"`), `innerRadiusRatio`, các `slices` (label / value / share / góc bắt đầu & kết thúc), số liệu thống kê tóm tắt (số lượng lát, tổng, lát lớn nhất), một bản tóm tắt ngôn ngữ tự nhiên có tính xác định, và một bảng a11y. Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Source

Các prop được định kiểu là [`PieChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
