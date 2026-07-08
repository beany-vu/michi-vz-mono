---
title: Biểu đồ tròn / Vành khuyên
description: "Biểu đồ tròn và vành khuyên: các múi được vẽ theo kích thước giá trị, gắn nhãn phần trăm, sắp xếp để múi lớn nhất đọc trước tiên; đặt innerRadiusRatio lớn hơn 0 để có vành khuyên."
---
# Biểu đồ tròn / Vành khuyên

<span class="vp-badge tip">Cơ cấu</span>

"Mỗi phần chiếm bao nhiêu tỷ trọng trong tổng thể?" Câu hỏi lâu đời nhất trong ngành biểu đồ, và một biểu đồ tròn vẫn trả lời tốt nhất khi chỉ có một số ít múi. Mỗi múi được vẽ theo kích thước giá trị và gắn nhãn phần trăm; các múi được sắp xếp theo giá trị để múi lớn nhất đọc trước tiên. Muốn dùng vành khuyên thay vào đó? Đó là **cùng một biểu đồ** - chỉ cần đặt `innerRadiusRatio` lớn hơn 0 để khoét lỗ giữa (khi đó context sẽ báo `mode: "donut"`).

<ChartDemo chart="pie-chart" :legend="false" />

Biến thể vành khuyên chỉ cách một prop - đây là cùng các tỷ trọng đó với `innerRadiusRatio: 0.6`, một `padAngle` nhỏ, và các góc bo tròn:

<ChartDemo chart="pie-chart" :index="1" :legend="false" />

> Giữ số lượng múi ở mức thấp (khoảng 6 hoặc ít hơn). Với nhiều danh mục hơn, [biểu đồ cột](/vi/charts/comparable) hoặc [treemap](/vi/charts/treemap) đọc chính xác hơn một biểu đồ tròn.

## Khi nào nên dùng

- **Tỷ trọng cho slide báo cáo.** Vài lát cắt, mỗi lát gắn nhãn phần trăm: vẫn là cách nhanh nhất để một slide trả lời "ai chiếm bao nhiêu phần của tổng thể".
- **Vành khuyên cho dashboard.** Đặt `innerRadiusRatio` là có ngay lỗ tròn ở giữa: vị trí đắc địa cho con số tiêu đề mà biểu đồ đang chứng minh.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makePie() {
  const palette = ["#005aba", "#f0a500", "#2aa39a", "#c0392b", "#7952b3", "#e67e22", "#16a085", "#8e44ad", "#2c3e50", "#d35400"];
  const dataSet = [];
  for (let i = 0; i < 40; i++) {
    dataSet.push({
      label: `Segment ${i + 1}`,
      value: Math.round(20 + Math.random() * 480),
      color: palette[i % palette.length],
    });
  }
  // Ẩn chú giải ở đây: 40 mục chú giải sẽ tràn khỏi khung demo; rê chuột lên từng lát để xem chi tiết.
  return { dataSet, showLabels: true, showLegend: false };
}
</script>

PieChart có `renderer="webgpu"` tùy chọn, vẽ các múi thành các cung do GPU dựng trong khi nhãn, chú giải và tooltip vẫn nằm trên lớp SVG. Tính năng này được kiểm soát theo khả năng phần cứng: trên trình duyệt không có WebGPU, nó tự động hạ cấp về canvas, và `getContext().renderer` báo cáo bộ dựng thực sự đã vẽ.

<WebgpuHeavyDemo element="michi-vz-pie-chart" :make="makePie" caption="40 múi" />

## Cách dùng

::: code-group

```tsx [React]
import { PieChart } from "@michi-vz/react";

export default () => <PieChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { PieChart } from "@michi-vz/vue";
</script>

<template>
  <PieChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { pieChart } from "@michi-vz/svelte";
</script>

<div use:pieChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyPieChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-pie-chart #c></michi-vz-pie-chart>
applyPieChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-pie-chart id="c"></michi-vz-pie-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, innerRadiusRatio, …
</script>
```

```ts [Vanilla JS]
import { mountPieChart } from "@michi-vz/core";

const chart = mountPieChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Cấu trúc dữ liệu

Mỗi mục `dataSet` là một múi: một `label`, một `value`, và một `color` tùy chọn.

```ts
const props = {
  innerRadiusRatio: 0, // 0 = pie; e.g. 0.6 = donut
  showLabels: true,    // % labels inside large-enough slices
  showLegend: true,
  dataSet: [
    { label: "Industry", value: 281, color: "#005aba" },
    { label: "Agri-food", value: 381, color: "#f0a500" },
    { label: "Materials", value: 132, color: "#2aa39a" },
  ],
};
```

## Biểu đồ tròn so với vành khuyên

Một engine duy nhất vẽ cả hai. `innerRadiusRatio` là lỗ giữa tính theo tỷ lệ bán kính ngoài: `0` là biểu đồ tròn đặc, `0.6` là vành khuyên. `padAngle` (radian) thêm khoảng cách giữa các múi và `cornerRadius` bo tròn các góc cung. Các múi, tooltip, `getContext()` và sự tương đồng SVG/canvas đều giống nhau ở cả hai trường hợp.

## API

Các prop được định kiểu là `PieChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc bộ dựng. Tham chiếu đầy đủ: [API Biểu đồ tròn / Vành khuyên](/vi/api/pie).
