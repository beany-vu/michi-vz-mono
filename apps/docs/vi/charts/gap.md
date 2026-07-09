---
title: Biểu đồ khoảng cách
description: "Biểu đồ khoảng cách: vẽ hai giá trị cho mỗi nhãn (trước và sau, mục tiêu và thực tế) và thanh nối giữa chúng chính là câu chuyện; khoảng cách càng rộng, nó càng nói lên nhiều điều."
---
# Biểu đồ khoảng cách

<span class="vp-badge tip">So sánh</span>

Hai con số quan trọng cách nhau bao xa? Vẽ trước và sau, mục tiêu và thực tế, nam và nữ, và thanh nối giữa chúng chính là câu chuyện - khoảng cách càng rộng, nó càng nói lên nhiều điều.

<ChartDemo chart="gap-chart" :legend="false" />

> Biểu đồ ở trên là **cùng một engine** trong mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Khi nào nên dùng

- **Mục tiêu và thực tế, trước và sau, dự báo và kết quả.** Mỗi hàng hai giá trị, và khoảng cách giữa chúng mới là điều đáng nói: bản thân thanh khoảng cách chính là kết luận.
- **Xếp hạng theo mức chênh.** Chỉ cần sắp xếp các hàng là những cú về đích ấn tượng nhất (hay những cú hụt sâu nhất) nổi lên ngay: sinh ra cho buổi họp sáng thứ Hai điểm lại ai đã thu hẹp được khoảng cách.
- **Nếu độ lớn tuyệt đối quan trọng hơn phần chênh lệch**, hai cột con nằm cạnh nhau trong [biểu đồ cột so sánh](/vi/charts/comparable) giúp đọc cả hai đại lượng dễ hơn.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
// Life expectancy at birth, 1990 -> 2023 for ~195 countries, sorted by 2023 value
// and coloured by region. Synthetic but shaped like the real story: nearly every
// country gains, and the lower the 1990 start the bigger the catch-up.
function makeGap() {
  const regions = [
    { name: "Africa", color: "#e07b39", count: 54, base: 50, spread: 9, gain: 11 },
    { name: "Asia", color: "#2a9d8f", count: 48, base: 62, spread: 8, gain: 9 },
    { name: "Americas", color: "#457b9d", count: 35, base: 67, spread: 6, gain: 6 },
    { name: "Europe", color: "#9b5de5", count: 44, base: 72, spread: 4, gain: 6 },
    { name: "Oceania", color: "#d7263d", count: 14, base: 64, spread: 8, gain: 7 },
  ];
  const dataSet = [];
  const colorsMapping = {};
  for (const r of regions) {
    for (let i = 0; i < r.count; i++) {
      const v1990 = r.base + (Math.random() - 0.5) * 2 * r.spread;
      const gain = Math.max(-1.5, r.gain * (0.35 + Math.random() * 0.9));
      const v2023 = Math.min(86, v1990 + gain);
      const label = `${r.name} ${i + 1}`;
      colorsMapping[label] = r.color;
      dataSet.push({
        label,
        code: r.name,
        value1: Math.round(v1990 * 10) / 10,
        value2: Math.round(v2023 * 10) / 10,
        difference: Math.round((v1990 - v2023) * 10) / 10,
        date: "2023",
      });
    }
  }
  // Sorted by where each country ENDS, the wall of dumbbells reads as one sweep.
  dataSet.sort((a, b) => b.value2 - a.value2);
  return {
    title: "Life expectancy at birth: 1990 (circle) to 2023 (triangle), years (synthetic)",
    dataSet,
    colorsMapping,
    xAxisDataType: "number",
    xAxisDomain: [35, 90],
    interactiveRowLabels: true,
    shapeValue1: "circle",
    shapeValue2: "triangle",
    shapesLabelsMapping: { value1: "1990", value2: "2023", gap: "Gain" },
  };
}
</script>

GapChart có tùy chọn `renderer="webgpu"` để vẽ các marker value1/value2 và các thanh nối dưới dạng hình theo instance trên GPU trong khi trục, nhãn và tooltip vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas, và `getContext().renderer` báo cáo bất kỳ renderer nào thực sự đã vẽ.

<WebgpuHeavyDemo
  element="michi-vz-gap-chart"
  :make="makeGap"
  :legend="[
    { label: 'Africa', color: '#e07b39' },
    { label: 'Asia', color: '#2a9d8f' },
    { label: 'Americas', color: '#457b9d' },
    { label: 'Europe', color: '#9b5de5' },
    { label: 'Oceania', color: '#d7263d' },
  ]" caption="~195 quốc gia" />

## Xem dữ liệu chạy theo năm

Gắn `date` cho từng dòng rồi bật `timeline`: biểu đồ thành câu chuyện theo từng năm với nút play và thanh tua riêng, mỗi lần hiển thị một giai đoạn. Mặc định tắt - không bật thì biểu đồ giữ nguyên.

<TimelinePlayDemo chart="gap" hint="Bấm nút play dưới biểu đồ: dữ liệu chạy qua từng năm, mỗi lần một snapshot. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<GapChartHandle>(null);

<GapChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<GapChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:gapChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyGapChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-gap-chart id="c"></michi-vz-gap-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` chỉnh nhịp chạy, `loop` quay vòng, `autoplay: true` tự chạy khi mount, `showControl: false` ẩn thanh điều khiển có sẵn.
- Controller headless luôn sẵn sàng: `chart.timeline()` cho `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, kèm `onStep` và `formatPeriod` trong config khi cần tự dựng UI.
- `filter` (top-N, sắp xếp) vẫn áp dụng bên trong từng giai đoạn, nên "top 5 mỗi năm" chạy được ngay.
- Dòng không có `date` hiển thị ở mọi giai đoạn.

## Cách dùng

::: code-group

```tsx [React]
import { GapChart } from "@michi-vz/react";

export default () => <GapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { GapChart } from "@michi-vz/vue";
</script>

<template>
  <GapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { gapChart } from "@michi-vz/svelte";
</script>

<div use:gapChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyGapChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-gap-chart #c></michi-vz-gap-chart>
applyGapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-gap-chart id="c"></michi-vz-gap-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountGapChart } from "@michi-vz/core";

const chart = mountGapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `GapChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer.
