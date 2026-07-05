---
title: Sankey
description: "Biểu đồ Sankey cho các dòng chảy: các nút được bố trí theo cột với độ dày dải bằng giá trị dòng chảy, dùng cho thương mại, ngân sách, và lưu lượng truy cập tách rồi hợp lại."
---
# Sankey

<span class="vp-badge tip">Dòng chảy</span>

"Tất cả rồi sẽ đi đâu?" Một biểu đồ Sankey theo dõi dòng chảy qua một hệ thống: các nút được bố trí theo cột, và **độ dày của mỗi dải chính là giá trị dòng chảy**. Đây là hình ảnh phù hợp cho thương mại giữa các nhà xuất khẩu và thị trường, ngân sách từ nguồn đến nơi sử dụng, lưu lượng truy cập từ nguồn giới thiệu đến các trang - bất cứ nơi nào một đại lượng tách ra rồi hợp lại trên đường đi của nó.

<ChartDemo chart="sankey-chart" />

> Bố cục được tính toán bằng [d3-sankey](https://github.com/d3/d3-sankey): các nút được gán vào các cột từ cấu trúc topology của đồ thị, sắp xếp theo chiều dọc, và các liên kết được vẽ thành các dải ngang mượt. Di chuột vào một nút hoặc một dòng chảy để xem con số.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeSankey() {
  const columns = [
    { prefix: "Source", count: 8, color: "#e63946" },
    { prefix: "Hub", count: 12, color: "#1d3557" },
    { prefix: "Region", count: 12, color: "#2a9d8f" },
    { prefix: "Market", count: 8, color: "#e9c46a" },
  ];
  const nodes = [];
  const columnIds = columns.map((col) => []);
  columns.forEach((col, ci) => {
    for (let i = 0; i < col.count; i++) {
      const id = `${col.prefix} ${i + 1}`;
      nodes.push({ id, color: col.color });
      columnIds[ci].push(id);
    }
  });
  const links = [];
  for (let ci = 0; ci < columns.length - 1; ci++) {
    const from = columnIds[ci];
    const to = columnIds[ci + 1];
    // Ensure every node has at least one outgoing and one incoming link.
    from.forEach((source, i) => {
      const target = to[i % to.length];
      links.push({ source, target, value: 5 + Math.round(Math.random() * 45) });
    });
    to.forEach((target, i) => {
      const source = from[i % from.length];
      if (!links.some((l) => l.source === source && l.target === target)) {
        links.push({ source, target, value: 5 + Math.round(Math.random() * 45) });
      }
    });
  }
  // Top up with extra random cross-links (within the same adjacent columns) until ~150.
  let guard = 0;
  while (links.length < 150 && guard < 5000) {
    guard++;
    const ci = Math.floor(Math.random() * (columns.length - 1));
    const from = columnIds[ci];
    const to = columnIds[ci + 1];
    const source = from[Math.floor(Math.random() * from.length)];
    const target = to[Math.floor(Math.random() * to.length)];
    if (links.some((l) => l.source === source && l.target === target)) continue;
    links.push({ source, target, value: 5 + Math.round(Math.random() * 45) });
  }
  return { linkColorMode: "source", nodeRadius: 3, linkRadius: 2, nodes, links };
}
</script>

`renderer="webgpu"` tùy chọn của biểu đồ này vẽ các mark trên GPU trong khi trục/nhãn/tooltip vẫn nằm trên SVG; được kiểm soát theo khả năng phần cứng với tự động chuyển về canvas.

<WebgpuHeavyDemo element="michi-vz-sankey-chart" :make="makeSankey" caption="~150 liên kết" />

## Cách dùng

::: code-group

```tsx [React]
import { SankeyChart } from "@michi-vz/react";

export default () => <SankeyChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { SankeyChart } from "@michi-vz/vue";
</script>

<template>
  <SankeyChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { sankeyChart } from "@michi-vz/svelte";
</script>

<div use:sankeyChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applySankeyChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-sankey-chart #c></michi-vz-sankey-chart>
applySankeyChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-sankey-chart id="c"></michi-vz-sankey-chart>
<script>
  Object.assign(document.getElementById("c"), props); // nodes, links, …
</script>
```

```ts [Vanilla JS]
import { mountSankeyChart } from "@michi-vz/core";

const chart = mountSankeyChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Cấu trúc dữ liệu

Khác với các biểu đồ khác, một Sankey nhận hai mảng: `nodes` (mỗi nút có một `id` duy nhất, một `label` và `color` tùy chọn) và `links` (`source` → `target` theo id, kèm một `value`).

```ts
const props = {
  linkColorMode: "source", // colour links by their source (or "target")
  nodes: [
    { id: "France" }, { id: "Germany" },
    { id: "EU" }, { id: "Asia" },
  ],
  links: [
    { source: "France", target: "EU", value: 40 },
    { source: "France", target: "Asia", value: 22 },
    { source: "Germany", target: "EU", value: 55 },
    { source: "Germany", target: "Asia", value: 35 },
  ],
};
```

Một liên kết trỏ tới một id nút không xác định (hoặc một nút nằm trong `disabledItems`) sẽ bị bỏ kèm một `datawarning`; vô hiệu hóa một nút cũng bỏ luôn các liên kết của nó.

## Các tùy chỉnh bố cục

`nodeWidth` đặt chiều rộng hình chữ nhật của nút, `nodePadding` khoảng cách dọc giữa các nút trong một cột, và `linkOpacity` độ trong suốt của các dải. `linkColorMode` tô màu mỗi dải theo nút `source` (mặc định) hoặc `target` của nó. Bản sao a11y và `getContext()` hiển thị các liên kết dưới dạng bảng "Nguồn → Đích: giá trị" có thể đọc được.

**Nút bo tròn.** `nodeRadius` (px, mặc định `2`) bo tròn các góc hình chữ nhật của nút - tăng lên để có kiểu viên thuốc, hoặc đặt `0` cho góc vuông. Giá trị này bị giới hạn ở nửa cạnh ngắn hơn của nút, nên không bao giờ làm biến dạng một nút mỏng.

**Dòng chảy bo tròn.** Các dòng chảy được vẽ dưới dạng dải tô đặc; `linkRadius` (px, mặc định `2`) bo tròn các góc của chúng nơi gặp các nút, tạo kết nối mềm mại hơn (bị giới hạn ở nửa độ dày của dải; `0` = sắc cạnh). `linkColorMode` tô màu mỗi dòng chảy theo nút `source` hoặc `target` của nó, ở mức `linkOpacity`:

```ts
const props = { nodeRadius: 4, linkRadius: 4, /* …nodes, links */ };
```

## API

Các prop được định kiểu là `SankeyChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc bộ dựng. Tham chiếu đầy đủ: [API Sankey](/vi/api/sankey).
