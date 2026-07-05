---
title: API Biểu đồ bong bóng
---

# API Biểu đồ bong bóng

Các vòng tròn được nhóm theo lực hút (gravity-clustered), có kích thước theo giá trị, mỗi vòng tròn có thể tùy chọn được chia thành một lõi đã đạt được (realized core) và một vành chưa khai thác (untapped ring) - xem **[demo Biểu đồ bong bóng](/vi/charts/bubble)**.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/bubble-chart";
// <michi-vz-bubble-chart> is now defined
```

```ts [Vanilla JS]
import { mountBubbleChart } from "@michi-vz/core";

const chart = mountBubbleChart(el, props);
```

:::

## Thuộc tính

<PropsTable chart="bubble-chart" />

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo đầu vào |

## getContext()

`mountBubbleChart(el, props).getContext()` trả về **`BubbleChartContext`** độc lập với renderer: mảng phẳng `bubbles` (value / partial / remainder / percent), `splitLabels`, các số liệu thống kê tổng hợp (số lượng bong bóng, tổng, tổng theo từng phần, bong bóng lớn nhất, phần dư lớn nhất), một bản tóm tắt bằng ngôn ngữ tự nhiên có tính xác định và một bảng hỗ trợ khả năng tiếp cận a11y. Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Các thuộc tính (props) được định kiểu là [`BubbleChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
