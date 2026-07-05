---
title: Biểu đồ phân tán
description: "Biểu đồ phân tán cho thấy xu hướng, cụm và giá trị ngoại lai chỉ trong nháy mắt; kích thước bong bóng mang biến thứ ba và hệ số tương quan Pearson được trả về trong getContext()."
---
# Biểu đồ phân tán

<span class="vp-badge tip">Tương quan</span>

Nhiều X có thực sự làm thay đổi Y, hay bạn chỉ đang đuổi theo một sự trùng hợp? Vẽ các điểm của bạn ra, xu hướng, các cụm, cùng giá trị ngoại lai đều hiện chỉ trong nháy mắt, với kích thước bong bóng mang thêm một biến thứ ba miễn phí. Hệ số tương quan Pearson được trả về trong getContext(), nên bạn trích dẫn con số được luôn, khỏi cần nheo mắt nhìn đám mây điểm.

<ChartDemo chart="scatter-chart" />

> Biểu đồ ở trên là **cùng một engine** trên mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Khi nào nên dùng

- **Kiểm chứng một giả thuyết.** Chi tiêu có kéo tỷ lệ chuyển đổi lên không? Thâm niên có ảnh hưởng đến tỷ lệ rời bỏ không? Nhìn vào đám mây điểm là thấy ngay xu hướng, cụm và điểm ngoại lai, còn `getContext()` đưa sẵn hệ số tương quan Pearson để bạn trích vào báo cáo.
- **Tìm ra các phân khúc trước khi giá trị trung bình che mất chúng.** Cụm điểm và điểm ngoại lai lộ rõ trên biểu đồ phân tán từ rất lâu trước khi chúng kịp xuất hiện trong bảng tổng hợp: đây là cái nhìn đầu tiên nhà phân tích dành cho mọi bộ dữ liệu mới.
- **Nếu một trục là thời gian, hãy dùng [biểu đồ đường](/vi/charts/line)**: biểu đồ phân tán coi thời gian như một con số bình thường, làm mất trật tự đọc mà người xem mong đợi.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeScatter() {
  const clusters = [
    { label: "Cluster A", color: "#e63946", cx: 25, cy: 70 },
    { label: "Cluster B", color: "#1d3557", cx: 70, cy: 60 },
    { label: "Cluster C", color: "#2a9d8f", cx: 50, cy: 30 },
    { label: "Cluster D", color: "#e9c46a", cx: 80, cy: 25 },
    { label: "Cluster E", color: "#9b5de5", cx: 35, cy: 40 },
  ];
  const g = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const dataSet = [];
  const colorsMapping = {};
  for (const c of clusters) colorsMapping[c.label] = c.color;
  for (let i = 0; i < 50000; i++) {
    const c = clusters[i % clusters.length];
    dataSet.push({
      label: c.label,
      x: Math.max(0, Math.min(100, c.cx + g() * 7)),
      y: Math.max(0, Math.min(100, c.cy + g() * 7)),
    });
  }
  return { dataSet, colorsMapping, xAxisDataType: "number", xAxisDomain: [0, 100], yAxisDomain: [0, 100], sizeRange: [2, 2] };
}
</script>

ScatterChart có `renderer="webgpu"` tùy chọn, vẽ đám mây điểm thành các vòng tròn do GPU dựng hàng loạt trong khi trục, nhãn và tooltip vẫn nằm trên lớp SVG. Tính năng này được kiểm soát theo khả năng phần cứng: trên trình duyệt không có WebGPU, nó tự động hạ cấp về canvas, và `getContext().renderer` báo cáo bộ dựng thực sự đã vẽ.

<WebgpuHeavyDemo element="michi-vz-scatter-chart" :make="makeScatter" caption="50.000 điểm" />

## Cách dùng

::: code-group

```tsx [React]
import { ScatterChart } from "@michi-vz/react";

export default () => <ScatterChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ScatterChart } from "@michi-vz/vue";
</script>

<template>
  <ScatterChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { scatterChart } from "@michi-vz/svelte";
</script>

<div use:scatterChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyScatterChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-scatter-chart #c></michi-vz-scatter-chart>
applyScatterChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-scatter-chart id="c"></michi-vz-scatter-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountScatterChart } from "@michi-vz/core";

const chart = mountScatterChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `ScatterChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc bộ dựng.
