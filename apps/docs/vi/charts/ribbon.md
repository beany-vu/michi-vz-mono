---
title: Biểu đồ dải
description: "Biểu đồ dải cho sự thay đổi thứ hạng và tỷ trọng: các dải nối các cột của từng kỳ để bạn theo dõi một danh mục khi nó phình ra, thu hẹp lại, và đổi vị trí."
---
# Biểu đồ dải

<span class="vp-badge tip">Cơ cấu</span>

Ai đang tăng và ai đang tụt? Khi thị phần, phân bổ ngân sách, hoặc kết quả bầu cử xáo trộn từ kỳ này sang kỳ khác, các dải nối mỗi cột cho phép bạn theo dõi một danh mục duy nhất khi nó phình ra, thu hẹp lại, và đổi vị trí với các đối thủ.

<ChartDemo chart="ribbon-chart" />

> Biểu đồ ở trên là **cùng một engine** trên mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Khi nào nên dùng

- **Thị phần, phân bổ ngân sách, bảng xếp hạng.** Khi các nhóm đổi chỗ nhau qua từng kỳ, các dải nối khiến "ai vượt ai, và khi nào" trở thành điều đập vào mắt người đọc trước tiên.
- **Trình bày các cú đổi ngôi cho người làm kinh doanh.** Mỗi nhóm giữ nguyên màu khi phình ra, co lại và hoán đổi thứ hạng, nên mắt người xem theo được một "đối thủ" xuyên suốt câu chuyện.
- **Nếu chẳng có ai đổi chỗ ai**, các dải chạy song song và [biểu đồ vùng](/vi/charts/area) kể cùng câu chuyện tỷ trọng với ít nét vẽ hơn.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeRibbon() {
  const keys = Array.from({ length: 30 }, (_, i) => `Category ${i + 1}`);
  const palette = [
    "#e63946", "#1d3557", "#2a9d8f", "#e9c46a", "#9b5de5",
    "#f15bb5", "#00bbf9", "#00f5d4", "#fee440", "#4cb944",
  ];
  const colorsMapping = {};
  keys.forEach((k, i) => { colorsMapping[k] = palette[i % palette.length]; });
  // Each key gets a slowly drifting base weight so ribbons visibly swell/shrink/re-rank.
  const bases = keys.map(() => 2 + Math.random() * 8);
  const drifts = keys.map(() => (Math.random() - 0.5) * 0.8);
  const series = [];
  for (let p = 0; p < 15; p++) {
    const row = { date: `${2010 + p}` };
    keys.forEach((k, i) => {
      const wobble = Math.sin(p * 0.7 + i) * 1.5;
      row[k] = Math.max(0.5, bases[i] + drifts[i] * p + wobble);
    });
    series.push(row);
  }
  return { series, keys, colorsMapping };
}
</script>

RibbonChart có `renderer="webgpu"` tùy chọn, vẽ các dải của nó trên GPU trong khi trục, nhãn và tooltip vẫn nằm trên lớp SVG. Tính năng này được kiểm soát theo khả năng phần cứng: trên trình duyệt không có WebGPU, nó tự động hạ cấp về canvas, và `getContext().renderer` báo cáo bộ dựng thực sự đã vẽ.

<WebgpuHeavyDemo element="michi-vz-ribbon-chart" :make="makeRibbon" caption="dải dày đặc" />

## Hiệu ứng vẽ dần

Biểu đồ tự vẽ dần từ trái sang phải ngay khi mount, hiện lần lượt các nét vẽ trước khi ổn định vào vị trí. Mặc định tắt - không bật thì biểu đồ giữ nguyên như cũ.

<RevealDemo chart="ribbon-chart" replay-label="Chạy lại hiệu ứng" hint="Mỗi đường lớn dần từ năm đầu đến năm cuối; nhãn bám theo ngọn đường rồi dừng ở điểm cuối. Khi hệ điều hành bật reduced motion, biểu đồ hiển thị đầy đủ ngay lập tức." />

`progressiveDraw: true` dùng cấu hình mặc định (1200 ms, easeInOutCubic). Truyền object để tinh chỉnh:

::: code-group

```tsx [React]
const ref = useRef<RibbonChartHandle>(null);

<RibbonChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() chạy lại hiệu ứng khi cần
```

```vue [Vue]
<RibbonChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:ribbonChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyRibbonChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
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

Dữ liệu vốn đã trải dài qua nhiều năm nên không cần gắn thêm gì cả. Bật `timeline`: nút play và thanh tua riêng của biểu đồ chạy qua các năm đó, mỗi bước các dải ruy băng chỉ vẽ đến năm đang active rồi khi chạy tiếp sẽ nối dài mượt mà thêm ra. Kéo lùi thanh tua thì các dải cũng co lại tương ứng. Hover chỉ soi được phần đã thực sự vẽ ra. Mặc định tắt - không bật thì biểu đồ giữ nguyên.

<TimelinePlayDemo chart="ribbon-chart" hint="Bấm nút play dưới biểu đồ: biểu đồ vẽ dần đến từng năm khi chạy qua. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<RibbonChartHandle>(null);

<RibbonChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<RibbonChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:ribbonChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyRibbonChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
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
import { RibbonChart } from "@michi-vz/react";

export default () => <RibbonChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { RibbonChart } from "@michi-vz/vue";
</script>

<template>
  <RibbonChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { ribbonChart } from "@michi-vz/svelte";
</script>

<div use:ribbonChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyRibbonChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-ribbon-chart #c></michi-vz-ribbon-chart>
applyRibbonChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-ribbon-chart id="c"></michi-vz-ribbon-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountRibbonChart } from "@michi-vz/core";

const chart = mountRibbonChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `RibbonChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc bộ dựng.
