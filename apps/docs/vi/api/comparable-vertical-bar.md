---
title: API Biểu đồ cột dọc so sánh
---

# API Biểu đồ cột dọc so sánh

Hai giá trị cho mỗi danh mục, giá trị gốc (based) so với giá trị so sánh (compared), dưới dạng các cột chồng lên nhau ở toàn bộ bề rộng với một mũi tên biến động tùy chọn phía trên mỗi cặp - xem **[demo Biểu đồ cột dọc so sánh](/vi/charts/comparable-vertical-bar)**.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/comparable-vertical-bar-chart";
// <michi-vz-comparable-vertical-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountComparableVerticalBarChart } from "@michi-vz/core";

const chart = mountComparableVerticalBarChart(el, props);
```

:::

## Thuộc tính

<PropsTable chart="comparable-vertical-bar-chart" />

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo đầu vào |

## getContext()

`mountComparableVerticalBarChart(el, props).getContext()` trả về **`ComparableVerticalBarChartContext`** độc lập với renderer (số liệu thống kê có cấu trúc + một bản tóm tắt bằng ngôn ngữ tự nhiên có tính xác định + một bảng hỗ trợ khả năng tiếp cận a11y). Khác với ComparableHorizontalBarChart, ngữ cảnh này phản ánh `deltaIndicator` khi được kích hoạt: `series[].deltaDirection` / `deltaColor` / `deltaLabel`, và `stats.grew` / `stats.shrank` / `stats.unchanged` / `stats.improved` / `stats.worsened`. Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Các thuộc tính (props) được định kiểu là [`ComparableVerticalBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
