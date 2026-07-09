---
title: Biểu đồ radar
description: "Biểu đồ radar để so sánh các lựa chọn trên cùng một tập tiêu chí: mỗi ứng viên trở thành một đa giác mà các đỉnh nhô ra và lõm vào cho thấy điểm mạnh, điểm yếu chỉ trong nháy mắt."
---
# Biểu đồ radar

<span class="vp-badge tip">So sánh</span>

Lựa chọn nào thắng, và thắng ở đâu? Đặt vài ứng viên chồng lên cùng một tập tiêu chí, mỗi ứng viên thành một đa giác bạn đọc được chỉ trong nháy mắt: đỉnh nhô ra cho thấy mọi điểm mạnh, chỗ lõm vào cho thấy mọi điểm yếu, và phần chồng lấn cho thấy chính xác nơi họ đổi vị trí cho nhau.

<ChartDemo chart="radar-chart" />

> Biểu đồ ở trên là **cùng một engine** trên mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Khi nào nên dùng

- **Bảng chấm điểm.** Đánh giá nhà cung cấp, ứng viên, sản phẩm: vài lựa chọn trên cùng một bộ tiêu chí, mỗi lựa chọn là một đa giác mà đỉnh nhọn là điểm mạnh, chỗ lõm là điểm yếu.
- **Cân bằng hay chuyên biệt.** Đa giác càng tròn đều càng toàn diện; đa giác nhọn hoắt đặt cược tất cả vào vài trục. Câu chuyện hình dáng ấy là thứ bảng số liệu không kể được.
- **Giữ ở mức vài thực thể và 5-12 trục.** Cần so sánh chính xác trên một tiêu chí, [biểu đồ cột so sánh](/vi/charts/comparable) cho đọc đúng từng giá trị; radar dành cho cái nhìn tổng thể.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeRadar() {
  const axes = [
    "Healthcare", "Education", "Cost of living", "Safety",
    "Environment", "Culture", "Infrastructure", "Climate",
    "Jobs", "Nightlife", "Walkability", "Diversity",
  ];
  const palette = ["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e"];
  const names = ["Vienna", "Singapore", "Lisbon", "Auckland"];
  const series = names.map((label, i) => ({
    label,
    color: palette[i],
    values: axes.map(() => Math.round(20 + Math.random() * 80)),
  }));
  return { axes, series, maxValue: 100, fillOpacity: 0.2 };
}
</script>

RadarChart có `renderer="webgpu"` tùy chọn, vẽ phần tô đa giác và các marker ở cực bằng các mark do GPU dựng hàng loạt trong khi trục, nhãn và tooltip vẫn nằm trên lớp SVG. Tính năng này được kiểm soát theo khả năng phần cứng: trên trình duyệt không có WebGPU, nó tự động hạ cấp về canvas, và `getContext().renderer` báo cáo bộ dựng thực sự đã vẽ.

<WebgpuHeavyDemo legend element="michi-vz-radar-chart" :make="makeRadar" caption="12 trục × 4 chuỗi" />

## Xem dữ liệu chạy theo năm

RadarChart đã dùng `date` cho hình dạng `{ date, value }` theo từng trục kiểu cũ, nên tag của timeline được đặt tên là `period` thay vì `date`. Gắn `period` cho từng dòng chuỗi rồi bật `timeline`: snapshot của một năm là các dòng chia sẻ `period` đó, và mỗi đa giác tự biến hình mượt giữa các năm. Mặc định tắt - không bật thì biểu đồ giữ nguyên. Đây là kiểu chạy từng năm có tương tác, không phải hiệu ứng vào cảnh một lần bên dưới.

```ts
{ label: "Vienna", period: "2021", values: [72, 65, 40, 88 /* … */] }
```

<TimelinePlayDemo chart="radar-chart" hint="Bấm nút play dưới biểu đồ: dữ liệu chạy qua từng năm, mỗi lần một snapshot. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<RadarChartHandle>(null);

<RadarChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RadarChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:radarChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRadarChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
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
- Chuỗi không có `period` vẫn hiển thị ở mọi giai đoạn.
- `timeline` thắng `progressiveDraw` khi cả hai cùng đặt - hiệu ứng vẽ dần bên dưới đứng yên khi timeline đang điều khiển.

## Hiệu ứng vẽ dần

Biểu đồ tự vẽ dần từ trái sang phải ngay khi mount, hiện lần lượt các nét vẽ trước khi ổn định vào vị trí. Mặc định tắt - không bật thì biểu đồ giữ nguyên như cũ.

<RevealDemo chart="radar-chart" replay-label="Chạy lại hiệu ứng" hint="Mỗi đường lớn dần từ năm đầu đến năm cuối; nhãn bám theo ngọn đường rồi dừng ở điểm cuối. Khi hệ điều hành bật reduced motion, biểu đồ hiển thị đầy đủ ngay lập tức." />

`progressiveDraw: true` dùng cấu hình mặc định (1200 ms, easeInOutCubic). Truyền object để tinh chỉnh:

::: code-group

```tsx [React]
const ref = useRef<RadarChartHandle>(null);

<RadarChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() chạy lại hiệu ứng khi cần
```

```vue [Vue]
<RadarChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:radarChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRadarChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
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
- Hiệu ứng vẽ dần chỉ chạy một lần khi mount; mục xem dữ liệu chạy theo năm ở trên chạy từng năm một theo yêu cầu.

## Cách dùng

::: code-group

```tsx [React]
import { RadarChart } from "@michi-vz/react";

export default () => <RadarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RadarChart } from "@michi-vz/vue";
</script>

<template>
  <RadarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { radarChart } from "@michi-vz/svelte";
</script>

<div use:radarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRadarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-radar-chart #c></michi-vz-radar-chart>
applyRadarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-radar-chart id="c"></michi-vz-radar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRadarChart } from "@michi-vz/core";

const chart = mountRadarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `RadarChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc bộ dựng.
