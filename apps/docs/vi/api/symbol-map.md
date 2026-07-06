---
title: API Bản đồ ký hiệu
---

# API Bản đồ ký hiệu

Một bản đồ ký hiệu/bong bóng khử chồng lấn bằng mô phỏng lực: bạn cung cấp lng/lat cho mỗi mục, một mô phỏng một lần đẩy các vòng tròn chồng lấn ra xa nhau - xem **[demo Bản đồ ký hiệu](/vi/charts/symbol-map)**.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/symbol-map-chart";
// <michi-vz-symbol-map-chart> is now defined
```

```ts [Vanilla JS]
import { mountSymbolMapChart } from "@michi-vz/core";

const chart = mountSymbolMapChart(el, props);
```

:::

## Thuộc tính

<PropsTable chart="symbol-map-chart" />

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo (lng/lat thiếu hoặc không hợp lệ, giá trị âm, id trùng lặp) |

## getContext()

`mountSymbolMapChart(el, props).getContext()` trả về **`SymbolMapChartContext`** độc lập với renderer: `stats.locatedCount` / `visibleCount` / `hiddenCount` (bị loại bởi `radiusVisibleMin`) / `invalidCount` (bị loại vì tọa độ không hợp lệ) / `valueDomain` / `largest` / `smallest`, một mảng `symbols[]` (một hàng cho mỗi mục hiển thị: `id`, `label`, `value`, `valueSecond`, `radius`, `radiusSecond`, `color`), tên `projection` đã phân giải, một bản tóm tắt bằng ngôn ngữ tự nhiên có tính xác định, và một `a11yTable`. Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Các thuộc tính (props) được định kiểu là [`SymbolMapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
