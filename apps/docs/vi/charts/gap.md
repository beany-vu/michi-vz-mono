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
function makeGap() {
  const countries = [
    { label: "United States", code: "USA" },
    { label: "Russia", code: "RUS" },
    { label: "Germany", code: "DEU" },
    { label: "China", code: "CHN" },
    { label: "United Kingdom", code: "GBR" },
    { label: "India", code: "IND" },
    { label: "Brazil", code: "BRA" },
    { label: "Japan", code: "JPN" },
    { label: "France", code: "FRA" },
    { label: "Canada", code: "CAN" },
    { label: "Australia", code: "AUS" },
    { label: "South Africa", code: "ZAF" },
  ];
  const dataSet = [];
  for (let i = 0; i < 120; i++) {
    const c = countries[i % countries.length];
    const value1 = 2 + Math.random() * 20;
    const value2 = 2 + Math.random() * 20;
    dataSet.push({
      label: `${c.label} #${i}`,
      code: c.code,
      value1,
      value2,
      difference: value1 - value2,
      date: "2023",
    });
  }
  return {
    dataSet,
    xAxisDataType: "number",
    shapeValue1: "circle",
    shapeValue2: "triangle",
    shapesLabelsMapping: { value1: "2010", value2: "2023", gap: "Change" },
  };
}
</script>

GapChart có tùy chọn `renderer="webgpu"` để vẽ các marker value1/value2 và các thanh nối dưới dạng hình theo instance trên GPU trong khi trục, nhãn và tooltip vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas, và `getContext().renderer` báo cáo bất kỳ renderer nào thực sự đã vẽ.

<WebgpuHeavyDemo element="michi-vz-gap-chart" :make="makeGap" caption="~120 rows" />

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

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
