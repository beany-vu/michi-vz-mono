---
title: API Bản đồ phân cấp màu
---

# API Bản đồ phân cấp màu

Một bản đồ phân cấp màu thế giới/khu vực: GeoJSON của riêng bạn, được tô màu theo thang màu ngưỡng hoặc một bản đồ danh mục rõ ràng - xem **[demo Bản đồ phân cấp màu](/vi/charts/choropleth-map)**.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/choropleth-map-chart";
// <michi-vz-choropleth-map-chart> is now defined
```

```ts [Vanilla JS]
import { mountChoroplethMapChart } from "@michi-vz/core";

const chart = mountChoroplethMapChart(el, props);
```

:::

## Thuộc tính

<PropsTable chart="choropleth-map-chart" />

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo (id dataSet không khớp, feature thiếu id, hình học không hợp lệ) |

## getContext()

`mountChoroplethMapChart(el, props).getContext()` trả về **`ChoroplethMapChartContext`** độc lập với renderer: `stats.featureCount` / `matchedCount` / `unmatchedCount` / `valueDomain` / `min` / `max`, một mảng `regions[]` (một hàng cho mỗi feature: `id`, `label`, `value?`, `color`, `matched`), tên `projection` đã phân giải, một bản tóm tắt bằng ngôn ngữ tự nhiên có tính xác định, và một `a11yTable` liệt kê mỗi khu vực + giá trị + cờ khớp. Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Các thuộc tính (props) được định kiểu là [`ChoroplethMapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
