---
title: API Biểu đồ cột kép (Tornado)
---

# API Biểu đồ cột kép (Tornado)

Các cột phân kỳ từ một đường trung tâm, dùng khi bạn cần thể hiện bên nào thắng và thắng bao nhiêu - xem **[demo Biểu đồ cột kép (Tornado)](/vi/charts/dual)**.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/dual-horizontal-bar-chart";
// <michi-vz-dual-horizontal-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountDualHorizontalBarChart } from "@michi-vz/core";

const chart = mountDualHorizontalBarChart(el, props);
```

:::

## Thuộc tính

<PropsTable chart="dual-horizontal-bar-chart" />

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo đầu vào |

## getContext()

`mountDualHorizontalBarChart(el, props).getContext()` trả về **`DualBarChartContext`** độc lập với renderer (số liệu thống kê có cấu trúc + một bản tóm tắt bằng ngôn ngữ tự nhiên có tính xác định + một bảng hỗ trợ khả năng tiếp cận a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Các thuộc tính (props) được định kiểu là [`DualBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
