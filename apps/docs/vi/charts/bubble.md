---
title: Biểu đồ bong bóng
description: "Biểu đồ bong bóng với kích thước chuẩn theo diện tích và bố cục trọng lực; mỗi bong bóng có thể tách thành một lõi đã hiện thực hóa và một vành chưa khai thác, thể hiện quy mô và tiến độ cùng lúc."
---
# Biểu đồ bong bóng

<span class="vp-badge tip">Cấu thành</span>

"Mỗi cái lớn cỡ nào, và bao nhiêu phần trong đó đã được hiện thực hóa?" Một đám mây bong bóng trả lời về độ lớn chỉ trong nháy mắt: mỗi vòng tròn có kích thước theo giá trị (**diện tích**, không phải bán kính), và một mô phỏng trọng lực kéo chúng vào một cụm gọn gàng để những cái lớn rõ ràng nổi bật. Giống như [treemap](/vi/charts/treemap), mỗi bong bóng có thể mang một **phần tách hai phần** - một lõi đã hiện thực hóa đặc bên trong một vành chưa khai thác nhạt hơn - để bạn đọc được cả quy mô lẫn tiến độ cùng lúc.

<ChartDemo chart="bubble-chart" />

Không cần tách? Bỏ `partial` để có một đám mây tỷ lệ gọn gàng, mỗi danh mục một màu:

<ChartDemo chart="bubble-chart" :index="1" />

> Cụm được bố trí bằng [d3-force](https://github.com/d3/d3-force): các bong bóng rơi về phía trung tâm (`gravity`) và đẩy nhau ra để không bao giờ chồng lấn (va chạm). Mô phỏng được ổn định **đồng bộ**, nên SVG và canvas dựng ra cùng một bố cục giống hệt nhau, có thể tái tạo được.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeBubble() {
  const categories = [
    { label: "Machinery", color: "#e63946" },
    { label: "Fruits", color: "#1d3557" },
    { label: "Oil seeds", color: "#2a9d8f" },
    { label: "Beverages", color: "#e9c46a" },
    { label: "Ferrous metals", color: "#9b5de5" },
    { label: "Textiles", color: "#f4a261" },
  ];
  const dataSet = [];
  for (let i = 0; i < 2000; i++) {
    const c = categories[i % categories.length];
    dataSet.push({
      label: `${c.label} #${i}`,
      value: 5 + Math.random() * 150,
      color: c.color,
    });
  }
  return { dataSet, gravity: 0.06, padding: 0.5 };
}
</script>

BubbleChart có tùy chọn `renderer="webgpu"` để vẽ đám mây bong bóng dưới dạng các vòng tròn theo instance trên GPU trong khi nhãn và tooltip vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas, và `getContext().renderer` báo cáo bất kỳ renderer nào thực sự đã vẽ.

<WebgpuHeavyDemo element="michi-vz-bubble-chart" :make="makeBubble" caption="~2,000 bubbles" />

## Cách dùng

::: code-group

```tsx [React]
import { BubbleChart } from "@michi-vz/react";

export default () => <BubbleChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { BubbleChart } from "@michi-vz/vue";
</script>

<template>
  <BubbleChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { bubbleChart } from "@michi-vz/svelte";
</script>

<div use:bubbleChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyBubbleChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-bubble-chart #c></michi-vz-bubble-chart>
applyBubbleChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-bubble-chart id="c"></michi-vz-bubble-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, splitLabels, …
</script>
```

```ts [Vanilla JS]
import { mountBubbleChart } from "@michi-vz/core";

const chart = mountBubbleChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Cấu trúc dữ liệu

Mỗi phần tử `dataSet` là một bong bóng: một `label`, một `value` (diện tích), một `partial` tùy chọn (phần đã hiện thực hóa), và một `color` tùy chọn.

```ts
const props = {
  splitLabels: ["Realized", "Untapped"],
  showLegend: true,
  gravity: 0.09, // higher = tighter cluster
  dataSet: [
    { label: "Germany", value: 120, partial: 64 }, // 53% realized
    { label: "United States", value: 152, partial: 88 },
    { label: "China", value: 168, partial: 51 },
  ],
};
```

## Trọng lực & phần tách

`gravity` quy định các bong bóng bị kéo về trung tâm mạnh đến đâu (càng cao = càng chặt), `padding` là khoảng cách giữa chúng, và `fillRatio` là đám mây lấp bao nhiêu phần của khu vực vẽ. Phần tách phản chiếu treemap: `partial` khắc ra một lõi đã hiện thực hóa chuẩn theo diện tích (bán kính `r·√(partial/value)`), và phần còn lại hiện lên như một sắc thái nhạt hơn của cùng tông màu - một màu đặc dưới một lớp phủ trắng, để nó hoạt động tốt trên cả nền sáng **và** nền tối. Đặt tên cho các phần bằng `splitLabels`.

## API

Các prop được định kiểu là `BubbleChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer. Tài liệu tham khảo đầy đủ: [Bubble API](/vi/api/bubble).
