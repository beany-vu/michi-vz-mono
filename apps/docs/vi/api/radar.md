---
title: API Biểu đồ radar
---

# API Biểu đồ radar

Xếp chồng vài ứng viên lên cùng một bộ tiêu chí chung và đọc ra ai thắng ở đâu chỉ trong nháy mắt. Xem **[bản demo Biểu đồ radar](/vi/charts/radar)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/radar-chart";
// <michi-vz-radar-chart> is now defined
```

```ts [Vanilla JS]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
```

:::

## Props

<PropsTable chart="radar-chart" />

## Events

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng cung cấp tương đương qua các callback `on*` trong bảng ở trên):

| Event | Detail | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | khi trạng thái tô sáng hover thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | khi một color mapping được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | khi dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | khi phát hiện cảnh báo về dữ liệu đầu vào |

## getContext()

`mountRadarChart(el, props).getContext()` trả về một **`RadarChartContext`** không phụ thuộc bộ dựng (số liệu thống kê có cấu trúc + một bản tóm tắt ngôn ngữ tự nhiên có tính xác định + một bảng a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Source

Các prop được định kiểu là [`RadarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
