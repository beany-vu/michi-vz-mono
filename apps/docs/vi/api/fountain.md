---
title: API Đài phun (Jet d'Eau)
---

# API Đài phun (Jet d'Eau)

Một biểu đồ, hai chế độ: chiều cao đỉnh tia = giá trị, chùm tia nở rộng = độ bất định. Trục x dạng phân loại (categorical) = ảnh chụp nhanh/so sánh (snapshot/comparison); trục x dạng thời gian hoặc số = xu hướng (trend) - xem **[demo Đài phun](/vi/charts/fountain)**.

## Nhập

::: code-group

```ts [Web Component]
import "@michi-vz/wc/fountain-chart";
// <michi-vz-fountain-chart> is now defined
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
```

:::

## Thuộc tính

<PropsTable chart="fountain-chart" />

::: tip Hai chế độ, một cấu trúc dữ liệu
Đặt `xAxisDataType: "band"` (hoặc bỏ qua nó) để dùng **chế độ Snapshot (ảnh chụp nhanh)** - mỗi mục có dải trục x (x-band) riêng, đặt cạnh nhau. Cung cấp `xAxisDataType` dạng thời gian hoặc số cùng với một trường `date` trên mỗi mục để dùng **chế độ Trend (xu hướng)** - các tia nước được đặt dọc theo trục thời gian và một đường xu hướng nối các đỉnh của chúng. Một mục có `predicted: true` sẽ được vẽ bằng nét đứt với đỉnh sủi bọt nhiều hơn.
:::

## Sự kiện

Web component phát ra (dispatch) các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng phơi bày các sự kiện tương tự thông qua các callback `on*` trong bảng ở trên):

| Sự kiện | Chi tiết | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | trạng thái nổi bật lúc di chuột thay đổi (nhãn tia nước) |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo đầu vào (ví dụ: giá trị hoặc độ lệch (spread) không hữu hạn) |

## getContext()

`mountFountainChart(el, props).getContext()` trả về **`FountainChartContext`** độc lập với renderer:

- **`mode`** - `"snapshot"` khi trục x là dạng phân loại/dải (categorical/band), `"trend"` khi trục x là dạng thời gian/số.
- **`jets`** - một mục cho mỗi tia nước đang hiển thị: `{ label, code?, color, value, spread, upperBound, spreadRatio, predicted, xPosition }`. `upperBound` = `value + spread`; `spreadRatio` = `spread / value` (độ bất định tương đối); `xPosition` là giá trị ngày/số gốc trong chế độ trend, hoặc `null` trong chế độ snapshot.
- **`stats`** - đối tượng tổng hợp:
  - `jetCount` - số lượng tia nước đang hiển thị.
  - `tallest` - `{ label, value }` của tia nước cao nhất, hoặc `null` nếu rỗng.
  - `frothiest` - `{ label, spreadRatio }` của tia nước bất định nhất, hoặc `null` nếu rỗng.
  - `trendSlope` - độ dốc của một hồi quy tuyến tính qua các giá trị tia nước theo chỉ số trong chế độ trend; `null` trong chế độ snapshot.
  - `valueRange` - `[min, max]` của các giá trị tia nước, hoặc `null` nếu rỗng.
  - `predictedCount` - số lượng tia nước dự báo.

Xem [ngữ cảnh LLM](/vi/guide/llm-context) để biết cách sử dụng ngữ cảnh này trong prompt và báo cáo.

## Nguồn

Các thuộc tính (props) được định kiểu là [`FountainChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
