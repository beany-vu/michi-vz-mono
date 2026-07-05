---
title: API Biểu đồ quả tạ
---

# API Biểu đồ quả tạ

Nối các đoạn (segment) trên mỗi hàng để thấy chính xác phần đóng góp của từng bước vào tổng nằm ở đâu - các thuộc tính, sự kiện và engine bên dưới; xem nó chuyển động trong **[demo Biểu đồ quả tạ](/vi/charts/bar-bell)**.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/bar-bell-chart";
// <michi-vz-bar-bell-chart> is now defined
```

```ts [Vanilla JS]
import { mountBarBellChart } from "@michi-vz/core";

const chart = mountBarBellChart(el, props);
```

:::

## Thuộc tính

<PropsTable chart="bar-bell-chart" />

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo đầu vào |

## getContext()

`mountBarBellChart(el, props).getContext()` trả về **`BarBellChartContext`** độc lập với renderer (số liệu thống kê có cấu trúc + một bản tóm tắt bằng ngôn ngữ tự nhiên có tính xác định + một bảng hỗ trợ khả năng tiếp cận a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Các thuộc tính (props) được định kiểu là [`BarBellChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
