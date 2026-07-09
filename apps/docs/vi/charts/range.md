---
title: Biểu đồ khoảng
description: "Biểu đồ khoảng: tô toàn bộ độ trải rộng của mỗi chuỗi (kịch bản tốt nhất đến xấu nhất, hình nón dự báo, dải phần trăm) để sự bất định là điều người đọc có thể thấy được."
---
# Biểu đồ khoảng

<span class="vp-badge tip">Xu hướng</span>

"Độ trải rộng lớn đến đâu?" Khi một đường đơn lẻ nói dối về dữ liệu của bạn, hãy vẽ dải thay vào đó. Kịch bản tốt nhất đến xấu nhất, hình nón dự báo, dải phần trăm thứ 5 đến thứ 95 - biểu đồ này tô toàn bộ khoảng của mỗi chuỗi để sự bất định là điều người đọc có thể thấy được, chứ không phải phỏng đoán.

<ChartDemo chart="range-chart" />

> Biểu đồ ở trên là **cùng một engine** trên mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Khi nào nên dùng

- **Khi một đường kẻ đơn lẻ sẽ nói quá mức độ chắc chắn.** Hình nón dự báo, dải bách phân vị 5-95, kịch bản tốt nhất đến xấu nhất: bề rộng của dải chính là câu trả lời trung thực.
- **So sánh độ biến động giữa các chuỗi.** Một dải rộng nằm cạnh một dải hẹp là lời cảnh báo rủi ro mà không giá trị trung bình nào nói được: biên độ danh mục đầu tư, độ trồi sụt SLA, khoảng nhiệt độ.
- **Các mức tin cậy lồng nhau quanh một dự báo?** Đó chính là việc [biểu đồ hình quạt](/vi/charts/fan) làm sẵn cho bạn: các dải và đường trung vị trong một lệnh gọi.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeRange() {
  const series = [
    { label: "India", color: "#2563eb", base: 6.5, drift: 0.02, spread: 0.8 },
    { label: "United States", color: "#16a34a", base: 2.6, drift: -0.01, spread: 0.6 },
    { label: "China", color: "#dc2626", base: 4.8, drift: -0.03, spread: 0.9 },
    { label: "Germany", color: "#7c3aed", base: 1.2, drift: 0.01, spread: 0.5 },
    { label: "Brazil", color: "#ea580c", base: 2.1, drift: 0.015, spread: 1.1 },
    { label: "Nigeria", color: "#0891b2", base: 3.4, drift: 0.02, spread: 1.3 },
    { label: "Japan", color: "#be185d", base: 0.9, drift: -0.005, spread: 0.4 },
    { label: "Indonesia", color: "#65a30d", base: 5.1, drift: 0.01, spread: 0.9 },
    { label: "France", color: "#9333ea", base: 1.4, drift: 0.005, spread: 0.5 },
    { label: "South Africa", color: "#ca8a04", base: 1.8, drift: -0.02, spread: 1.0 },
  ];
  const pointsPerSeries = 20;
  const dataSet = series.map((s) => {
    const points = [];
    for (let i = 0; i < pointsPerSeries; i++) {
      const year = 2020 + i;
      const wobble = Math.sin(i * 0.7 + s.base) * s.spread * 0.5;
      const mid = s.base + s.drift * i + wobble;
      points.push({
        date: year,
        valueMin: Number((mid - s.spread / 2).toFixed(2)),
        valueMax: Number((mid + s.spread / 2).toFixed(2)),
        valueMedium: Number(mid.toFixed(2)),
        certainty: i < pointsPerSeries - 5,
      });
    }
    return { label: s.label, color: s.color, series: points };
  });
  return { dataSet, xAxisDataType: "date_annual", fillOpacity: 0.55 };
}
</script>

RangeChart có `renderer="webgpu"` tùy chọn, vẽ các dải min/max bằng hình học do GPU dựng hàng loạt trong khi trục, nhãn và tooltip vẫn nằm trên lớp SVG. Tính năng này được kiểm soát theo khả năng phần cứng: trên trình duyệt không có WebGPU, nó tự động hạ cấp về canvas, và `getContext().renderer` báo cáo bộ dựng thực sự đã vẽ.

<WebgpuHeavyDemo legend element="michi-vz-range-chart" :make="makeRange" caption="~200 dải" />

## Hiệu ứng vẽ dần

Biểu đồ tự vẽ dần từ trái sang phải ngay khi mount, hiện lần lượt các nét vẽ trước khi ổn định vào vị trí. Mặc định tắt - không bật thì biểu đồ giữ nguyên như cũ.

<RevealDemo chart="range-chart" replay-label="Chạy lại hiệu ứng" hint="Mỗi đường lớn dần từ năm đầu đến năm cuối; nhãn bám theo ngọn đường rồi dừng ở điểm cuối. Khi hệ điều hành bật reduced motion, biểu đồ hiển thị đầy đủ ngay lập tức." />

`progressiveDraw: true` dùng cấu hình mặc định (1200 ms, easeInOutCubic). Truyền object để tinh chỉnh:

::: code-group

```tsx [React]
const ref = useRef<RangeChartHandle>(null);

<RangeChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() chạy lại hiệu ứng khi cần
```

```vue [Vue]
<RangeChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:rangeChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRangeChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-range-chart id="c"></michi-vz-range-chart>
<script>
  const el = document.getElementById("c");
  el.progressiveDraw = { durationMs: 2000 };
  // el.replay() chạy lại hiệu ứng
</script>
```

:::

- `durationMs` và `easing` ("linear", "easeOutQuad", "easeInOutCubic", hoặc hàm `(t) => t` tự viết) quyết định nhịp vẽ.
- `autoplay: false` hiển thị biểu đồ vẽ sẵn đầy đủ; gọi `replay()` (ref handle bên React, method của web component, hoặc instance của core) để chạy hiệu ứng khi cần. `replayOnUpdate: true` chạy lại mỗi lần dữ liệu thay đổi.
- Tôn trọng `prefers-reduced-motion`: biểu đồ hiển thị đầy đủ ngay, không animation.

## Xem dữ liệu chạy theo năm

Dữ liệu vốn đã trải dài qua nhiều năm nên không cần gắn thêm gì cả. Bật `timeline`: nút play và thanh tua riêng của biểu đồ chạy qua các năm đó, mỗi bước các dải chỉ vẽ đến năm đang active rồi khi chạy tiếp sẽ nối dài mượt mà thêm ra. Kéo lùi thanh tua thì các dải cũng co lại tương ứng. Hover chỉ soi được phần đã thực sự vẽ ra. Mặc định tắt - không bật thì biểu đồ giữ nguyên.

<TimelinePlayDemo chart="range-chart" hint="Bấm nút play dưới biểu đồ: biểu đồ vẽ dần đến từng năm khi chạy qua. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<RangeChartHandle>(null);

<RangeChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RangeChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:rangeChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRangeChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-range-chart id="c"></michi-vz-range-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` chỉnh nhịp chạy, `loop` quay vòng, `autoplay: true` tự chạy khi mount, `showControl: false` ẩn thanh điều khiển có sẵn.
- Controller headless luôn sẵn sàng: `chart.timeline()` cho `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, kèm `onStep` và `formatPeriod` trong config khi cần tự dựng UI.
- Giá trị trượt mượt giữa các năm theo mặc định (`interpolate`); đặt `interpolate: false` để cắt thẳng. Khi bật reduced motion, biểu đồ luôn cắt thẳng.
- `timeline` được ưu tiên hơn `progressiveDraw` khi cả hai cùng được bật trên một biểu đồ.

## Cách dùng

::: code-group

```tsx [React]
import { RangeChart } from "@michi-vz/react";

export default () => <RangeChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RangeChart } from "@michi-vz/vue";
</script>

<template>
  <RangeChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { rangeChart } from "@michi-vz/svelte";
</script>

<div use:rangeChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRangeChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-range-chart #c></michi-vz-range-chart>
applyRangeChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-range-chart id="c"></michi-vz-range-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRangeChart } from "@michi-vz/core";

const chart = mountRangeChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `RangeChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc bộ dựng.
