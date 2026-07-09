---
title: Biểu đồ cột dọc so sánh
description: "Biểu đồ cột dọc so sánh: hai cột chồng lên nhau ở toàn bộ bề rộng cho mỗi danh mục - giá trị gốc ở phía sau, giá trị so sánh ở phía trước - với một mũi tên biến động phía trên mỗi cặp. Đích di trú theo chiều dọc cho BarchartVertical cũ của sdg-trade."
---
# Biểu đồ cột dọc so sánh

<span class="vp-badge tip">So sánh</span>

Nó đã trở nên tốt hơn hay tệ hơn, theo từng danh mục? Mỗi cột chồng hai thanh toàn bộ bề rộng - giá trị tham chiếu ở phía sau, giá trị hiện tại ở phía trước - cùng một mũi tên biến động + nhãn cho thấy sự thay đổi chỉ trong một cái nhìn.

<ChartDemo
  chart="comparable-vertical-bar-chart"
  :legend="[
    { label: '2019 (gốc, màu nhạt, phía sau)', color: '#b1b1b1' },
    { label: '2024 (so sánh, màu đậm, phía trước)', color: '#6e6e6e' },
  ]"
/>

> Biểu đồ ở trên là **cùng một engine** trong mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeComparableVertical() {
  const colors = ["#c0392b", "#2c6fbb", "#1f1f1f", "#e07b39", "#2e8b57", "#8e44ad", "#16a085"];
  const dataSet = [];
  for (let i = 0; i < 60; i++) {
    const base = 50 + Math.round(Math.random() * 950);
    const compared = Math.max(1, Math.round(base * (0.6 + Math.random() * 0.8)));
    dataSet.push({
      label: `Sector ${i + 1}`,
      valueBased: base,
      valueCompared: compared,
      color: colors[i % colors.length],
    });
  }
  return { title: "Sector export value: 2019 vs 2024, US$ bn (synthetic)", dataSet };
}
</script>

ComparableVerticalBarChart có tùy chọn `renderer="webgpu"` để vẽ hai cột con của mỗi cột dưới dạng hình chữ nhật theo instance trên GPU trong khi trục, nhãn và chỉ báo biến động vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas, và `getContext().renderer` báo cáo bất kỳ renderer nào thực sự đã vẽ.

<WebgpuHeavyDemo element="michi-vz-comparable-vertical-bar-chart" :make="makeComparableVertical" caption="~60 columns" />

## Xem dữ liệu chạy theo năm

Gắn `date` cho từng danh mục rồi bật `timeline`: biểu đồ cột dọc thành câu chuyện theo từng năm với nút play và thanh tua riêng, mỗi lần hiển thị cặp giá trị gốc/so sánh của một giai đoạn. Mặc định tắt - không bật thì biểu đồ giữ nguyên.

<TimelinePlayDemo chart="comparable-vertical-bar-chart" hint="Bấm nút play dưới biểu đồ: dữ liệu chạy qua từng năm, mỗi lần một snapshot. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<ComparableVerticalBarChartHandle>(null);

<ComparableVerticalBarChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<ComparableVerticalBarChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:comparableVerticalBarChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyComparableVerticalBarChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-comparable-vertical-bar-chart id="c"></michi-vz-comparable-vertical-bar-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` chỉnh nhịp chạy, `loop` quay vòng, `autoplay: true` tự chạy khi mount, `showControl: false` ẩn thanh điều khiển có sẵn.
- Giá trị trượt mượt giữa các giai đoạn theo mặc định (`interpolate`); chỉnh chuyển động bằng `tweenMs` và `easing`, hoặc đặt `interpolate: false` để cắt thẳng. Khi bật reduced motion, biểu đồ luôn cắt thẳng.
- Controller headless luôn sẵn sàng: `chart.timeline()` cho `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, kèm `onStep` và `formatPeriod` trong config khi cần tự dựng UI.
- `filter` (top-N, sắp xếp) vẫn áp dụng bên trong từng giai đoạn, nên "top 5 mỗi năm" chạy được ngay.
- Cột không có `date` hiển thị ở mọi giai đoạn.

## Cách dùng

::: code-group

```tsx [React]
import { ComparableVerticalBarChart } from "@michi-vz/react";

export default () => <ComparableVerticalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ComparableVerticalBarChart } from "@michi-vz/vue";
</script>

<template>
  <ComparableVerticalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { comparableVerticalBarChart } from "@michi-vz/svelte";
</script>

<div use:comparableVerticalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyComparableVerticalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-comparable-vertical-bar-chart #c></michi-vz-comparable-vertical-bar-chart>
applyComparableVerticalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-comparable-vertical-bar-chart id="c"></michi-vz-comparable-vertical-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountComparableVerticalBarChart } from "@michi-vz/core";

const chart = mountComparableVerticalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `ComparableVerticalBarChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer.

## Ghi chú về hành vi

### Hai cột con toàn bộ bề rộng cho mỗi cột, thứ tự vẽ CỐ ĐỊNH

Mỗi danh mục vẽ `valueBased` (giá trị tham chiếu/trước đó, phía sau, có thể tô hoa văn) và `valueCompared` (giá trị hiện tại, phía trước, màu đặc), cả hai ở **cùng x và toàn bộ bề rộng cột** - khác với layout "grouped" nửa-dải tùy chọn của ComparableHorizontalBarChart, biểu đồ này chỉ chồng lớp. Thứ tự vẽ là **cố định** (không phụ thuộc bề rộng): `valueBased` luôn được vẽ phía sau, `valueCompared` luôn ở phía trước - chuyển thể từ thứ tự vẽ `BarCompare`/`Bar` của `BarchartVertical` cũ của sdg-trade. `colorsBasedMapping` cho cột con valueBased một màu riêng theo từng nhãn: kết hợp một tông màu sáng không trong suốt với `valueBasedOpacity: 1` để tương phản trước/sau rõ nhất trên cả hai theme. `valueBasedOpacity` / `valueComparedOpacity` đặt độ mờ tô của chúng (giao diện lịch sử: 0.45 / 0.9). Một cột con có màu tô đã phân giải là `transparent` sẽ bị **bỏ qua** (consumer ẩn một nửa qua CSS). `minBarHeight` (mặc định 5) đặt sàn cho một cột khác không để các giá trị gần bằng không vẫn hiển thị được.

### Chỉ báo biến động - và ngữ cảnh của biểu đồ này phản ánh nó

`deltaIndicator: { show: true }` vẽ một mũi tên biến động + nhãn định dạng PHÍA TRÊN cột con cao hơn trong hai cột con (vị trí kế thừa `translate(bandwidth/3, -32)`). Khác với ComparableHorizontalBarChart (nơi chỉ báo chỉ mang tính trình bày), **`getContext()` của biểu đồ này phản ánh chỉ báo**: mỗi hàng `series[]` mang `deltaDirection` / `deltaColor` / `deltaLabel` khi được kích hoạt, `stats.improved` / `stats.worsened` đếm số biến động tốt/xấu, và bảng a11y có thêm cột thứ năm "Change". `positiveIsGood` / `positiveIsUp` chọn cách ánh xạ màu/hướng (xem JSDoc của `DeltaIndicatorConfig` để biết bảng quyết định đầy đủ); `formatter(diff, datum)` toàn quyền kiểm soát văn bản nhãn. Nếu bỏ qua, hoặc `{ show: false }`, đây là no-op có thể chứng minh - không hình học, không DOM `.mv-delta`, không trường ngữ cảnh bổ sung.

### `patternsMapping` - tô bằng hoa văn / ảnh

`patternsMapping: Record<label, imageSrc>` tô cột con **value-based** bằng một ảnh lặp lại thay vì một màu đặc. `createHatchPattern({ color, angle?, spacing?, strokeWidth? })` (xuất từ `@michi-vz/core` và `@michi-vz/react`) trả về một data-URI SVG hoa văn gạch chéo cho trường hợp phổ biến. Bộ dựng SVG tham chiếu nó từ một `<defs><pattern>` thật; bộ dựng canvas lặp nó qua `ctx.createPattern` và dựng lại một khi ảnh tải xong.

### Trục giá trị (y)

`yAxisDomain: [min, max]` cố định phạm vi trục giá trị. `symmetricYDomain` buộc `[-M, M]` (M = giá trị tuyệt đối lớn nhất) để số không nằm giữa. `showZeroLineForYAxis` vẽ một đường đặc tại y=0 (cho biểu đồ phân kỳ); `showGrid` bật/tắt các đường lưới ngang (mặc định tắt). `yAxisFormat` định dạng nhãn của các mốc; `ticks` đặt số lượng mốc gần đúng.

### Trục danh mục (x)

Nhãn cột vừa vặn theo chiều ngang khi có đủ không gian; nếu không chúng nghiêng -45° (hoặc thu gọn thành một tập con dễ đọc với `xAxisMode: "horizontal"`), cùng layout `chooseAxisMode` mà VerticalStackBarChart dùng. `xAxisLabelPadding` nâng ngưỡng trước khi một nhãn xoay; `xAxisFormat` định dạng từng nhãn; `hideTickLabels` ẩn chúng hoàn toàn; `maxBarWidth` giới hạn độ dày mỗi cột (và căn giữa khu vực vẽ) để một vài danh mục không phình thành các khối khổng lồ.

### Tooltip

`tooltipFormatter(datum, dataSet, type)` nhận cột đang được trỏ chuột vào, tất cả các cột, và `type` của **cột con** đang được trỏ vào (`"based" | "compared"`). Nó trả về một chuỗi HTML; wrapper React còn nhận thêm một React node (được chuyển đổi thành HTML tĩnh). Tooltip có sẵn nhận biết cạnh (lật khi gần cạnh phải/dưới).

### Đang tải / không có dữ liệu + tương tác

`isLoading` và `isNodata` điều khiển lớp phủ (React: `isLoadingComponent` / `isNodataComponent`). Di chuột làm nổi bật một cột (các cột khác mờ đi) và `mouseleave` xóa trạng thái đó; các cột được bo tròn (bán kính 5) với viền 1px.

> **Cơ quan quyết định màu sắc của consumer:** ngữ cảnh mang theo `legendData` (`{ label, color, dataLabelSafe }`) để một hệ thống màu tiêm CSS có thể dùng làm khóa cho các quy tắc theo từng nhãn; `onChartDataProcessed` chỉ được phát ra khi ngữ cảnh **thay đổi** (phát lại một ngữ cảnh không đổi ở mỗi lần render có thể tạo vòng lặp cho một consumer dispatch ở mỗi lần gọi).
