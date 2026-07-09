---
title: Biểu đồ cột so sánh
description: "Biểu đồ cột so sánh: trước và sau được đặt cạnh nhau trên một cột cho mỗi nhãn, để khoảng cách đã thu hẹp hay mở rộng là điều đầu tiên người đọc nhìn thấy."
---
# Biểu đồ cột so sánh

<span class="vp-badge tip">So sánh</span>

Nó đã trở nên tốt hơn hay tệ hơn? Đặt trước và sau cạnh nhau trên một cột cho mỗi nhãn, và khoảng cách đã thu hẹp (hoặc mở rộng) là điều đầu tiên người đọc nhìn thấy.

<ChartDemo
  chart="comparable-horizontal-bar-chart"
  :legend="[
    { label: '2019 (trước, màu nhạt)', color: '#b1b1b1' },
    { label: '2024 (sau, màu đậm)', color: '#6e6e6e' },
  ]"
/>

> Biểu đồ ở trên là **cùng một engine** trong mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeComparable() {
  const colors = ["#c0392b", "#2c6fbb", "#1f1f1f", "#e07b39", "#2e8b57", "#8e44ad", "#16a085"];
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const base = 50 + Math.round(Math.random() * 2950);
    const compared = Math.max(1, Math.round(base * (0.6 + Math.random() * 0.8)));
    dataSet.push({
      label: `Region ${i + 1}`,
      valueBased: base,
      valueCompared: compared,
      color: colors[i % colors.length],
    });
  }
  return { title: "Merchandise exports: 2019 vs 2024, US$ bn (synthetic)", dataSet, interactiveRowLabels: true };
}
</script>

ComparableHorizontalBarChart có tùy chọn `renderer="webgpu"` để vẽ hai cột con của mỗi hàng dưới dạng hình chữ nhật theo instance trên GPU trong khi trục, nhãn và tooltip vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas, và `getContext().renderer` báo cáo bất kỳ renderer nào thực sự đã vẽ.

<WebgpuHeavyDemo element="michi-vz-comparable-horizontal-bar-chart" :make="makeComparable" caption="~120 rows" />

## Xem dữ liệu chạy theo năm

Gắn `date` cho từng dòng rồi bật `timeline`: biểu đồ cột thành câu chuyện theo từng năm với nút play và thanh tua riêng, mỗi lần hiển thị khoảng cách trước/sau của một giai đoạn. Mặc định tắt - không bật thì biểu đồ giữ nguyên.

<TimelinePlayDemo chart="comparable-horizontal-bar-chart" hint="Bấm nút play dưới biểu đồ: dữ liệu chạy qua từng năm, mỗi lần một snapshot. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<ComparableHorizontalBarChartHandle>(null);

<ComparableHorizontalBarChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<ComparableHorizontalBarChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:comparableHorizontalBarChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyComparableHorizontalBarChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-comparable-horizontal-bar-chart id="c"></michi-vz-comparable-horizontal-bar-chart>
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
- Dòng không có `date` hiển thị ở mọi giai đoạn.

## Cách dùng

::: code-group

```tsx [React]
import { ComparableHorizontalBarChart } from "@michi-vz/react";

export default () => <ComparableHorizontalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ComparableHorizontalBarChart } from "@michi-vz/vue";
</script>

<template>
  <ComparableHorizontalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { comparableHorizontalBarChart } from "@michi-vz/svelte";
</script>

<div use:comparableHorizontalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyComparableHorizontalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-comparable-horizontal-bar-chart #c></michi-vz-comparable-horizontal-bar-chart>
applyComparableHorizontalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-comparable-horizontal-bar-chart id="c"></michi-vz-comparable-horizontal-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountComparableHorizontalBarChart } from "@michi-vz/core";

const chart = mountComparableHorizontalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `ComparableHorizontalBarChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer.

## Ghi chú về hành vi

### Hai cột con cho mỗi hàng

Mỗi hàng vẽ `valueBased` (màu nhạt) và `valueCompared` (màu đậm), phân kỳ từ x=0; cột con ngắn hơn luôn được vẽ đè lên trên nên cả hai giá trị đều nhìn thấy được, dù tăng hay giảm. `colorsBasedMapping` cho cột con valueBased một màu riêng theo từng nhãn: kết hợp một tông màu sáng không trong suốt với `valueBasedOpacity: 1` (như demo ở trên) để tương phản trước/sau rõ nhất trên cả hai theme. `valueBasedOpacity` / `valueComparedOpacity` đặt độ mờ tô của chúng. Một cột con có màu tô đã phân giải là `transparent` sẽ bị **bỏ qua** (consumer ẩn một nửa qua CSS). `minBarWidth` (mặc định 5) đặt sàn cho một cột khác không để các giá trị gần bằng không vẫn hiển thị được.

### `patternsMapping` - tô bằng hoa văn / ảnh

`patternsMapping: Record<label, imageSrc>` tô cột con **value-based** bằng một ảnh lặp lại thay vì một màu đặc. `createHatchPattern({ color, angle?, spacing?, strokeWidth? })` (xuất từ `@michi-vz/core` và `@michi-vz/react`) trả về một data-URI SVG hoa văn gạch chéo cho trường hợp phổ biến. Bộ dựng canvas lặp nó qua `ctx.createPattern` và dựng lại một khi ảnh tải xong.

### Trục giá trị (x)

`xAxisPredefinedDomain: [min, max]` cố định phạm vi trục giá trị (bí danh của `xAxisDomain`). `showZeroLineForXAxis` vẽ một đường đặc tại x=0 (cho biểu đồ phân kỳ); `showGrid` bật/tắt các đường lưới dọc (mặc định tắt). `xAxisFormat` định dạng nhãn của các mốc.

### Cột nhãn (y)

Các nhãn danh mục trên trục y nằm trong một cột bên trái rộng `tickHtmlWidth` px (mặc định 100, có dấu chấm lửng). `padding.left` thụt vào **khu vực vẽ** (cột + trục giá trị) sang phải MÀ KHÔNG di chuyển các nhãn - mở ra không gian cho một cột nhãn rộng. `horizontalTickPosition: { x, y }` xê dịch các nhãn để căn chỉnh với một chú giải bên ngoài. `hideTickLabels` ẩn chúng hoàn toàn (khi tên danh mục đã nằm trong một chú giải).

### Tooltip

`tooltipFormatter(datum, dataSet, type)` nhận hàng đang được trỏ chuột vào, tất cả các hàng, và `type` của **cột con** đang được trỏ vào (`"based" | "compared"`). Nó trả về một chuỗi HTML; wrapper React còn nhận thêm một React node (được chuyển đổi thành HTML tĩnh). Tooltip có sẵn nhận biết cạnh (lật khi gần cạnh phải/trên).

### Đang tải / không có dữ liệu + tương tác

`isLoading` và `isNodata` điều khiển lớp phủ (React: `isLoadingComponent` / `isNodataComponent`). Di chuột làm nổi bật một hàng (các hàng khác mờ đi) và `mouseleave` xóa trạng thái đó; các cột được bo tròn (bán kính 5) với viền 1px.

> **Cơ quan quyết định màu sắc của consumer:** ngữ cảnh mang theo `legendData` (`{ label, color, dataLabelSafe }`) để một hệ thống màu tiêm CSS có thể dùng làm khóa cho các quy tắc theo từng nhãn; `onChartDataProcessed` chỉ được phát ra khi ngữ cảnh **thay đổi** (phát lại một ngữ cảnh không đổi ở mỗi lần render có thể tạo vòng lặp cho một consumer dispatch ở mỗi lần gọi).
