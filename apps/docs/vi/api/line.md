---
title: API Biểu đồ đường
---

# API Biểu đồ đường

Mọi thứ bạn cần để tích hợp biểu đồ đường bằng code; để xem câu chuyện và bản demo, xem **[bản demo Biểu đồ đường](/vi/charts/line)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/line-chart";
// <michi-vz-line-chart> is now defined
```

```ts [Vanilla JS]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, props);
```

:::

## Props

<PropsTable chart="line-chart" />

## Hiển thị lưới và trục

Bốn prop kiểm soát mật độ vạch chia trục y và cách vẽ đường lưới:

| Prop | Mặc định | Ghi chú |
| --- | --- | --- |
| `yTicks` | `10` | Số lượng vạch chia trục y gần đúng. Giá trị mặc định kế thừa là 10; đặt thấp hơn (ví dụ `5`) để trục thưa hơn. |
| `showGridLines` | `true` | Các đường lưới nét đứt ngang tại mỗi vạch chia y. |
| `showVerticalGridLines` | `false` | Các đường lưới nét đứt dọc tại mỗi vạch chia x. Biểu đồ phiên bản cũ không vẽ đường nào; chỉ bật khi các đường dẫn hướng thêm giúp dễ đọc hơn. |
| `highlightZeroLine` | `true` | Vẽ đường y=0 dưới dạng nét liền (tô màu bằng `--michi-vz-zero-line`, mặc định lấy theo màu lưới) thay vì một vạch chia nét đứt thông thường. Hữu ích khi tập dữ liệu trải cả giá trị dương lẫn âm. |

## Trạng thái đang tải và không có dữ liệu

Engine quản lý một thuộc tính `data-mv-state` trên phần tử host với ba giá trị - `"loading"`, `"nodata"`, và `"ready"` - và hiển thị các lớp phủ dựng sẵn cho hai trạng thái đầu trừ khi bạn tắt đi.

| Prop | Kiểu | Mặc định | Ghi chú |
| --- | --- | --- | --- |
| `isLoading` | `boolean` | `false` | Hiển thị lớp phủ `.mv-loading` và bỏ qua hoàn toàn việc kiểm tra không có dữ liệu. |
| `isNodata` | `boolean \| (dataSet) => boolean` | - | Ghi đè điều kiện mặc định (`dataSet` rỗng hoặc mọi chuỗi đều không có điểm nào). Truyền `false` để buộc biểu đồ vẫn hiển thị ngay cả khi dữ liệu trông như trống. |
| `noDataLabel` | `string` | - | Văn bản hiển thị bên trong lớp phủ `.mv-nodata` mặc định. Bị bỏ qua khi `suppressDefaultOverlay` là true. |
| `suppressDefaultOverlay` | `boolean` | `false` | Ngăn engine tự chèn node đang tải/không có dữ liệu của riêng nó. Dùng khi một wrapper framework (ví dụ `LineChart` của `@michi-vz/react`) render `isLoadingComponent` / `isNodataComponent` như một lớp phủ React thay thế. Host không bao giờ bị unmount - lớp phủ chỉ được xếp chồng lên trên. |

::: tip Hành vi của wrapper React
`LineChart` của `@michi-vz/react` tự động đặt `suppressDefaultOverlay` và render `isLoadingComponent` / `isNodataComponent` như một node React được định vị phía trên host của biểu đồ. DOM của biểu đồ luôn được mount, vì vậy `isNodataComponent` vẫn kích hoạt khi dữ liệu trống ngay cả khi không có điều kiện tùy chỉnh.
:::

## Font chữ

`fontFamily` đặt custom property CSS `--michi-vz-font-family` trên phần tử host, được cả bộ dựng văn bản SVG lẫn probe `getComputedStyle` của canvas đọc. Font phải đã được trang tải sẵn - không có việc nhúng font nào được thực hiện.

## ChartContext / legendData

`onChartDataProcessed` nhận một `LineChartContext` mở rộng từ `BaseChartContext`. Lớp cơ sở giờ đây mang thêm một trường `legendData`:

```ts
interface LegendItem {
  label: string;         // series label as it appears in dataSet
  color: string;         // resolved colour at the time of processing
  order: number;         // appearance order (legend slot index)
  disabled?: boolean;    // true when the label is currently hidden
  dataLabelSafe?: string; // sanitizeForClassName(label) - the CSS hook the canvas colour probe matches
}

interface BaseChartContext {
  // ... existing fields ...
  legendData?: LegendItem[]; // populated by LineChart; treat absence as []
}
```

`legendData` là payload chuẩn dành cho các bên chịu trách nhiệm về màu sắc phía consumer. Một wrapper framework tự quản lý CSS màu của riêng nó (ví dụ `useChartUtils` của thd MonitorV2) đọc `legendData[].{label, dataLabelSafe, color, disabled}` từ mỗi lần gọi `onChartDataProcessed` và phát ra các quy tắc `stroke`/`fill` theo từng nhãn, nhắm vào thuộc tính `data-label-safe`. Điều này thay thế nhu cầu phải đối chiếu chéo `colorsMapping` với thứ tự chuỗi.

## Events

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau đây (engine cũng cung cấp tương đương qua các callback `on*` trong bảng ở trên):

| Event | Detail | Kích hoạt khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | khi trạng thái tô sáng hover thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | khi một color mapping được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | khi dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | khi phát hiện cảnh báo về dữ liệu đầu vào |

## getContext()

`mountLineChart(el, props).getContext()` trả về một **`LineChartContext`** không phụ thuộc bộ dựng (renderer-agnostic) (số liệu thống kê có cấu trúc + một bản tóm tắt ngôn ngữ tự nhiên có tính xác định + một bảng a11y). Xem [ngữ cảnh LLM](/vi/guide/llm-context).

## Source

Các prop được định kiểu là [`LineChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
