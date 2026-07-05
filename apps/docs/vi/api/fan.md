---
title: API Biểu đồ hình quạt
---

# API Biểu đồ hình quạt

Vẽ dự báo và độ bất định của nó trong cùng một biểu đồ: dữ liệu lịch sử, một đường trung vị nét đứt, và các dải tin cậy (confidence band) mở rộng dần theo thời gian dự báo - xem **[demo Biểu đồ hình quạt](/vi/charts/fan)**.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/fan-chart";
// <michi-vz-fan-chart> is now defined
```

```ts [Vanilla JS]
import { mountFanChart } from "@michi-vz/core";

const chart = mountFanChart(el, props);
```

```ts [Insights helper]
import { forecastFan } from "@michi-vz/insights/forecast";

const item = forecastFan(history, { horizon: 4, levels: [0.5, 0.8], level: 0.95 }, "Revenue");
const chart = mountFanChart(el, { dataSet: [item], xAxisDataType: "date_annual" });
```

:::

## Thuộc tính

<PropsTable chart="fan-chart" />

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo đầu vào |

## getContext()

`mountFanChart(el, props).getContext()` trả về **`FanChartContext`** độc lập với renderer (số lượng điểm lịch sử/dự báo theo từng chuỗi, các mức dải (band levels), độ bất định cuối cùng, cùng với một bản tóm tắt bằng ngôn ngữ tự nhiên có tính xác định và một bảng hỗ trợ khả năng tiếp cận a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Các thuộc tính (props) được định kiểu là [`FanChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
