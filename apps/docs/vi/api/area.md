---
title: API Biểu đồ vùng
---

# API Biểu đồ vùng

Xem phần nào trong một tổng đang tăng thực sự là động lực chính - các thuộc tính (props) và sự kiện bên dưới, hoặc xem **[demo Biểu đồ vùng](/vi/charts/area)** để thấy nó hoạt động.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/area-chart";
// <michi-vz-area-chart> is now defined
```

```ts [Vanilla JS]
import { mountAreaChart } from "@michi-vz/core";

const chart = mountAreaChart(el, props);
```

:::

## Thuộc tính

<PropsTable chart="area-chart" />

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo đầu vào |

## getContext()

`mountAreaChart(el, props).getContext()` trả về **`AreaChartContext`** độc lập với renderer (số liệu thống kê có cấu trúc + một bản tóm tắt bằng ngôn ngữ tự nhiên có tính xác định + một bảng hỗ trợ khả năng tiếp cận a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Các thuộc tính (props) được định kiểu là [`AreaChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
