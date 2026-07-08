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
