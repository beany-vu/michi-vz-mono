---
title: Biểu đồ quả tạ
description: "Biểu đồ quả tạ: mỗi hàng xếp các phần của nó nối tiếp nhau với một nắp đầu ở mỗi bước, để tầm với tích lũy và tỷ phần của từng đoạn đều hiện rõ chỉ trong nháy mắt."
---
# Biểu đồ quả tạ

<span class="vp-badge tip">Cấu thành</span>

Một tổng cộng dồn được xếp chồng ra sao, từng mảnh một? Mỗi hàng xếp các phần của nó nối tiếp nhau với một nắp đầu ở mỗi bước, để cả tầm với tích lũy lẫn tỷ phần của từng đoạn đều hiện rõ chỉ trong nháy mắt.

<ChartDemo chart="bar-bell-chart" />

> Biểu đồ ở trên là **cùng một engine** trong mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Khi nào nên dùng

- **Phễu và tổng tích lũy.** Các phần cộng dồn thành tổng theo từng hàng, mỗi bước có một nắp tròn đánh dấu: các chặng pipeline, cấu thành chi phí, quãng đường cộng dồn.
- **Hai đối tượng người xem, một hàng biểu đồ.** Nhà phân tích đọc đóng góp của từng phân đoạn qua các nắp tròn; lãnh đạo đọc con số chốt ở cuối hàng. Không ai cần đến biểu đồ thứ hai.
- **Nếu việc so cùng một phân đoạn giữa các hàng quan trọng hơn tổng tích lũy của mỗi hàng**, [biểu đồ cột chồng dọc](/vi/charts/vertical-stack-bar) đã xếp các phân đoạn thẳng hàng sẵn cho bạn.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeBarBell() {
  const keys = ["Asia-Pacific", "Europe", "North America"];
  const colorsMapping = {
    "Asia-Pacific": "#d62728",
    "Europe": "#2ca02c",
    "North America": "#1f77b4",
  };
  const dataSet = [];
  let asia = 40, europe = 20, america = 10;
  for (let i = 0; i < 120; i++) {
    asia += Math.random() * 12;
    europe += Math.random() * 6;
    america += Math.random() * 4;
    dataSet.push({
      date: String(2000 + i),
      "Asia-Pacific": Math.round(asia),
      "Europe": Math.round(europe),
      "North America": Math.round(america),
    });
  }
  return { dataSet, keys, colorsMapping };
}
</script>

BarBellChart có tùy chọn `renderer="webgpu"` để vẽ các thanh đoạn và vòng tròn nắp đầu dưới dạng các mark theo instance trên GPU trong khi trục, nhãn và tooltip vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas, và `getContext().renderer` báo cáo bất kỳ renderer nào thực sự đã vẽ.

<WebgpuHeavyDemo legend element="michi-vz-bar-bell-chart" :make="makeBarBell" caption="~120 rows" />

## Xem dữ liệu chạy theo năm

BarBellChart đã dùng `date` cho hạng mục của hàng (dải trên trục y), nên tag của timeline được đặt tên là `period` thay vì `date`. Gắn `period` cho từng hàng rồi bật `timeline`: snapshot của một năm là các hàng chia sẻ `period` đó, và độ dài từng đoạn tự biến hình mượt giữa các năm. Mặc định tắt - không bật thì biểu đồ giữ nguyên. Đây là kiểu chạy từng năm có tương tác, không phải hiệu ứng vào cảnh một lần bên dưới.

```ts
{ period: "2021", date: "Kenya", exports: 40, domestic: 25 }
```

<TimelinePlayDemo chart="bar-bell-chart" hint="Bấm nút play dưới biểu đồ: dữ liệu chạy qua từng năm, mỗi lần một snapshot. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<BarBellChartHandle>(null);

<BarBellChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<BarBellChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:barBellChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyBarBellChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
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
- Hàng không có `period` vẫn hiển thị ở mọi giai đoạn.
- `timeline` thắng `progressiveDraw` khi cả hai cùng đặt - hiệu ứng vẽ dần bên dưới đứng yên khi timeline đang điều khiển.

## Hiệu ứng vẽ dần

Biểu đồ tự vẽ dần từ trái sang phải ngay khi mount, hiện lần lượt các nét vẽ trước khi ổn định vào vị trí. Mặc định tắt - không bật thì biểu đồ giữ nguyên như cũ.

<RevealDemo chart="bar-bell-chart" replay-label="Chạy lại hiệu ứng" hint="Mỗi đường lớn dần từ năm đầu đến năm cuối; nhãn bám theo ngọn đường rồi dừng ở điểm cuối. Khi hệ điều hành bật reduced motion, biểu đồ hiển thị đầy đủ ngay lập tức." />

`progressiveDraw: true` dùng cấu hình mặc định (1200 ms, easeInOutCubic). Truyền object để tinh chỉnh:

::: code-group

```tsx [React]
const ref = useRef<BarBellChartHandle>(null);

<BarBellChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() chạy lại hiệu ứng khi cần
```

```vue [Vue]
<BarBellChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:barBellChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyBarBellChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
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
import { BarBellChart } from "@michi-vz/react";

export default () => <BarBellChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { BarBellChart } from "@michi-vz/vue";
</script>

<template>
  <BarBellChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { barBellChart } from "@michi-vz/svelte";
</script>

<div use:barBellChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyBarBellChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-bar-bell-chart #c></michi-vz-bar-bell-chart>
applyBarBellChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-bar-bell-chart id="c"></michi-vz-bar-bell-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountBarBellChart } from "@michi-vz/core";

const chart = mountBarBellChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `BarBellChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer.
