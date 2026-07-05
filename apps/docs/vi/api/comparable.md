---
title: API Biểu đồ cột so sánh
---

# API Biểu đồ cột so sánh

Hai giá trị cho mỗi nhãn, giá trị gốc (based) so với giá trị so sánh (compared), giúp thấy ngay sự thay đổi trước/sau chỉ trong một cái nhìn - xem **[demo Biểu đồ cột so sánh](/vi/charts/comparable)**.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/comparable-horizontal-bar-chart";
// <michi-vz-comparable-horizontal-bar-chart> is now defined
```

```ts [Vanilla JS]
import { mountComparableHorizontalBarChart } from "@michi-vz/core";

const chart = mountComparableHorizontalBarChart(el, props);
```

:::

## Thuộc tính

<PropsTable chart="comparable-horizontal-bar-chart" />

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo đầu vào |

## getContext()

`mountComparableHorizontalBarChart(el, props).getContext()` trả về **`ComparableBarChartContext`** độc lập với renderer (số liệu thống kê có cấu trúc + một bản tóm tắt bằng ngôn ngữ tự nhiên có tính xác định + một bảng hỗ trợ khả năng tiếp cận a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Các thuộc tính (props) được định kiểu là [`ComparableBarChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
