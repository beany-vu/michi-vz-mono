---
title: API Biểu đồ khoảng cách
---

# API Biểu đồ khoảng cách

Thể hiện khoảng cách giữa hai con số và để cây cột truyền tải trọng điểm - xem **[demo Biểu đồ khoảng cách](/vi/charts/gap)**.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/gap-chart";
// <michi-vz-gap-chart> is now defined
```

```ts [Vanilla JS]
import { mountGapChart } from "@michi-vz/core";

const chart = mountGapChart(el, props);
```

:::

## Thuộc tính

<PropsTable chart="gap-chart" />

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo đầu vào |

## getContext()

`mountGapChart(el, props).getContext()` trả về **`GapChartContext`** độc lập với renderer (số liệu thống kê có cấu trúc + một bản tóm tắt bằng ngôn ngữ tự nhiên có tính xác định + một bảng hỗ trợ khả năng tiếp cận a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Các thuộc tính (props) được định kiểu là [`GapChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
