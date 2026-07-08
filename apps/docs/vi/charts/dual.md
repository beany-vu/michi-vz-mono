---
title: Biểu đồ cột kép (Tornado)
description: "Biểu đồ cột kép (tornado, tháp dân số): hai giá trị đối lập được neo vào một đường trung tâm chung để sự mất cân bằng hiện rõ chỉ trong nháy mắt."
---
# Biểu đồ cột kép (Tornado)

<span class="vp-badge tip">So sánh</span>

Bên nào thắng, và thắng bao nhiêu? Neo hai giá trị đối lập vào một đường trung tâm chung và sự mất cân bằng hiện rõ chỉ trong nháy mắt - trái so với phải, nam so với nữ, trước so với sau. Đây là tháp dân số kinh điển và biểu đồ tornado, nơi cột dài nhất chính là câu chuyện.

<ChartDemo
  chart="dual-horizontal-bar-chart"
  :legend="[
    { label: 'Nam (bên phải, màu đậm)', color: '#3F7CAC' },
    { label: 'Nữ (bên trái, màu nhạt)', color: '#95b7d1' },
  ]"
/>

> Biểu đồ ở trên là **cùng một engine** trong mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Khi nào nên dùng

- **Khi sự bất cân xứng chính là câu chuyện.** Tháp dân số, nhập khẩu và xuất khẩu, người ủng hộ và người phản đối: hai đại lượng đối nhau trên một trục giữa, bên nào lệch là thấy ngay.
- **Báo cáo một trang cho lãnh đạo.** Thanh dài nhất và bên nặng hơn truyền đạt thông điệp trước cả khi người xem kịp đọc một con số: lý tưởng khi bạn chỉ có mười giây chú ý.
- **Nếu hai giá trị không đối nghịch nhau** (năm nay và năm ngoái, mục tiêu và thực tế), hãy giữ cả hai cùng một phía của trục 0 bằng [biểu đồ cột so sánh](/vi/charts/comparable).

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeDual() {
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const base = 2 + Math.random() * 18;
    const skew = (Math.random() - 0.5) * 6;
    dataSet.push({
      label: `Row ${i + 1}`,
      value1: Number(Math.max(0.1, base + skew).toFixed(1)),
      value2: Number(Math.max(0.1, base - skew).toFixed(1)),
      color: "#3F7CAC",
    });
  }
  return {
    dataSet,
    title: "120 diverging rows (synthetic)",
    // Labels in the left margin, clear of the left-extending bars.
    yAxisPosition: "left",
    interactiveRowLabels: true,
    margin: { top: 50, right: 50, bottom: 50, left: 120 },
  };
}
</script>

DualHorizontalBarChart có tùy chọn `renderer="webgpu"` để vẽ các cột value1/value2 trên GPU trong khi trục, nhãn và tooltip vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas, và `getContext().renderer` báo cáo bất kỳ renderer nào thực sự đã vẽ.

<WebgpuHeavyDemo element="michi-vz-dual-horizontal-bar-chart" :make="makeDual" caption="~120 rows" />

## Cách dùng

::: code-group

```tsx [React]
import { DualHorizontalBarChart } from "@michi-vz/react";

export default () => <DualHorizontalBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { DualHorizontalBarChart } from "@michi-vz/vue";
</script>

<template>
  <DualHorizontalBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { dualHorizontalBarChart } from "@michi-vz/svelte";
</script>

<div use:dualHorizontalBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyDualHorizontalBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-dual-horizontal-bar-chart #c></michi-vz-dual-horizontal-bar-chart>
applyDualHorizontalBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-dual-horizontal-bar-chart id="c"></michi-vz-dual-horizontal-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountDualHorizontalBarChart } from "@michi-vz/core";

const chart = mountDualHorizontalBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `DualHorizontalBarChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer.
