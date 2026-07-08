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
