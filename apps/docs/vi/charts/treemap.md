---
title: Treemap
description: "Treemap với các ô được vẽ theo kích thước tổng và một cách chia hai phần tùy chọn cho thấy tỷ trọng đã đạt được so với chưa khai thác; lồng theo nhóm và gấp thành dạng xếp chồng trên màn hình hẹp."
---
# Treemap

<span class="vp-badge tip">Cơ cấu</span>

"Phần nào lớn nhất, và mỗi phần đã đạt được bao nhiêu?" Một treemap trả lời cả hai câu hỏi cùng lúc: mỗi ô vẽ theo tổng của nó, và một **cách chia hai phần** tùy chọn tô phần đặc bên trong mỗi ô, nhờ vậy bạn đọc được cả độ lớn (diện tích) lẫn tiến độ (phần chia) chỉ trong nháy mắt. Trường hợp kinh điển là tiềm năng xuất khẩu: diện tích ô = tổng tiềm năng, phần đặc = **đã đạt được**, phần nhạt hơn = **chưa khai thác**. Các ô lồng theo nhóm được, và trên màn hình hẹp toàn bộ gấp lại thành **dạng xếp chồng** một cột, dễ đọc.

<ChartDemo chart="treemap-chart" :legend="[]" />

Muốn dùng danh sách phẳng (mỗi ô một sản phẩm, mỗi ô một màu riêng - bố cục tiềm năng xuất khẩu kinh điển)? Bỏ lồng `children` và truyền trực tiếp các lá:

<ChartDemo chart="treemap-chart" :index="1" :legend="[]" />

> Cách chia này mang tính tổng quát. Đặt tên hai phần bằng `splitLabels` - `["Realized", "Untapped"]`, `["Used", "Free"]`, `["Done", "Remaining"]` - không có gì trong engine gán cứng một lĩnh vực cụ thể.

## Khi nào nên dùng

- **Bức tranh toàn danh mục.** Hàng trăm sản phẩm, ngành hàng hay khoản mục chi phí trên một màn hình: diện tích là quy mô, phần chia là tiến độ, cả cây phân cấp hiện đủ không cần cuộn trang.
- **"Nên dồn lực vào đâu?"** Những ô lớn mà phần lớn còn chưa khai thác chính là danh sách cơ hội, khỏi cần sắp xếp: cách đọc kinh điển của tiềm năng xuất khẩu và khảo sát thị trường.
- **Chỉ có khoảng chục nhóm phẳng?** [Biểu đồ cột](/vi/charts/comparable) hay [biểu đồ tròn](/vi/charts/pie) cho đọc giá trị chính xác nhanh hơn so diện tích ô; treemap phát huy giá trị khi dữ liệu ở quy mô lớn.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeTreemap() {
  const sectors = [
    { label: "Industry", color: "#1d3557" },
    { label: "Agri-food", color: "#e9c46a" },
    { label: "Materials", color: "#2a9d8f" },
    { label: "Textiles", color: "#e63946" },
    { label: "Pharmaceuticals", color: "#457b9d" },
    { label: "Energy", color: "#f4a261" },
    { label: "Electronics", color: "#9b5de5" },
    { label: "Services", color: "#06d6a0" },
  ];
  const dataSet = sectors.map((sector, si) => {
    const children = [];
    for (let i = 0; i < 50; i++) {
      const value = 5 + Math.round(Math.random() * 120);
      const partial = Math.round(Math.random() * value);
      children.push({
        label: `${sector.label} product ${si * 50 + i + 1}`,
        value,
        partial,
      });
    }
    return { label: sector.label, color: sector.color, children };
  });
  return { splitLabels: ["Realized", "Untapped"], showLegend: true, layout: "squarify", dataSet };
}
</script>

TreemapChart có `renderer="webgpu"` tùy chọn, vẽ các ô thành các hình chữ nhật do GPU dựng hàng loạt trong khi nhãn, tooltip và phần tô chia vẫn nằm trên lớp SVG. Tính năng này được kiểm soát theo khả năng phần cứng: trên trình duyệt không có WebGPU, nó tự động hạ cấp về canvas, và `getContext().renderer` báo cáo bộ dựng thực sự đã vẽ.

<WebgpuHeavyDemo element="michi-vz-treemap-chart" :make="makeTreemap" caption="~400 ô" />

## Cách dùng

::: code-group

```tsx [React]
import { TreemapChart } from "@michi-vz/react";

export default () => <TreemapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { TreemapChart } from "@michi-vz/vue";
</script>

<template>
  <TreemapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { treemapChart } from "@michi-vz/svelte";
</script>

<div use:treemapChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyTreemapChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-treemap-chart #c></michi-vz-treemap-chart>
applyTreemapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-treemap-chart id="c"></michi-vz-treemap-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, splitLabels, …
</script>
```

```ts [Vanilla JS]
import { mountTreemapChart } from "@michi-vz/core";

const chart = mountTreemapChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Cấu trúc dữ liệu

Mỗi node trong `dataSet` là một lá (`value`, `partial` tùy chọn) hoặc một nút cha (`children`). Giá trị của một nút cha là tổng các lá của nó.

```ts
const props = {
  splitLabels: ["Realized", "Untapped"],
  showLegend: true,
  layout: "auto", // squarify on desktop, stack on narrow screens
  dataSet: [
    { label: "Agri-food", children: [
      { label: "Fruits", value: 100, partial: 34 },   // 34% realized
      { label: "Beverages", value: 50, partial: 35 }, // 70% realized
    ]},
    { label: "Industry", children: [
      { label: "Machinery", value: 120, partial: 64 },
    ]},
  ],
};
```

## Bố cục đáp ứng (responsive)

`layout` chọn thuật toán xếp ô: `"squarify"` (kiểu treemap), `"stack"` (một phân vùng dọc một cột - các hàng rộng hết chiều ngang, chiều cao tỷ lệ với giá trị, cùng cách chia trong hàng), hoặc `"auto"` (chuyển sang stack khi thấp hơn `stackBreakpoint`, mặc định 480px). Phần chia, nhãn, tooltip, `getContext()` và sự tương đồng SVG/canvas đều giống nhau ở cả hai bố cục.

## API

Các prop được định kiểu là `TreemapChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc bộ dựng. Tham chiếu đầy đủ: [API Treemap](/vi/api/treemap).
