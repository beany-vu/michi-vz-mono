---
title: Biểu đồ bong bóng
description: "Biểu đồ bong bóng với kích thước chuẩn theo diện tích và bố cục trọng lực; mỗi bong bóng có thể tách thành một lõi đã hiện thực hóa và một vành chưa khai thác, thể hiện quy mô và tiến độ cùng lúc."
---
# Biểu đồ bong bóng

<span class="vp-badge tip">Cấu thành</span>

"Mỗi cái lớn cỡ nào, và bao nhiêu phần trong đó đã được hiện thực hóa?" Một đám mây bong bóng trả lời về độ lớn chỉ trong nháy mắt: mỗi vòng tròn có kích thước theo giá trị (**diện tích**, không phải bán kính), và một mô phỏng trọng lực kéo chúng vào một cụm gọn gàng để những cái lớn rõ ràng nổi bật. Giống như [treemap](/vi/charts/treemap), mỗi bong bóng có thể mang một **phần tách hai phần** - một lõi đã hiện thực hóa đặc bên trong một vành chưa khai thác nhạt hơn - để bạn đọc được cả quy mô lẫn tiến độ cùng lúc.

<ChartDemo chart="bubble-chart" :legend="[]" />

Không cần tách? Bỏ `partial` để có một đám mây tỷ lệ gọn gàng, mỗi danh mục một màu:

<ChartDemo chart="bubble-chart" :index="1" :legend="[]" />

> Cụm được bố trí bằng [d3-force](https://github.com/d3/d3-force): các bong bóng rơi về phía trung tâm (`gravity`) và đẩy nhau ra để không bao giờ chồng lấn (va chạm). Mô phỏng được ổn định **đồng bộ**, nên SVG và canvas dựng ra cùng một bố cục giống hệt nhau, có thể tái tạo được.

## Khi nào nên dùng

- **Độ lớn trong nháy mắt.** Sản phẩm, thị trường, từ khóa hiện thành một đám mây bong bóng có kích thước: khi "cái nào lớn?" quan trọng hơn thứ hạng chính xác, cụm bong bóng trả lời tức thì.
- **Bản đồ cơ hội.** Với phần chia, một bong bóng to mà lõi đã hiện thực hóa còn mỏng nghĩa là tiền vẫn đang nằm trên bàn: góc nhìn quét tìm dư địa cho các buổi rà soát danh mục.
- **Nếu vị trí cần mang ý nghĩa** (hai trục số, mối tương quan), đó là việc của [biểu đồ phân tán](/vi/charts/scatter); đám mây bong bóng đánh đổi vị trí lấy sự gọn gàng.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
// Another nod to CERN: one simulated collision event's worth of reconstructed
// energy clusters, one bubble per cluster, area = energy. A falling power-law
// spectrum means a few big deposits over thousands of soft ones - the gravity
// packing turns the event's whole energy budget into one readable cloud.
function makeBubble() {
  const subdetectors = [
    { label: "Tracker", color: "#457b9d", share: 0.38 },
    { label: "ECAL", color: "#2a9d8f", share: 0.3 },
    { label: "HCAL", color: "#e07b39", share: 0.24 },
    { label: "Muon chambers", color: "#9b5de5", share: 0.08 },
  ];
  const dataSet = [];
  let i = 0;
  for (const s of subdetectors) {
    const n = Math.round(1500 * s.share);
    for (let k = 0; k < n; k++) {
      dataSet.push({
        label: `${s.label} #${i++}`,
        // Falling energy spectrum: many soft clusters, a handful of hard ones.
        value: 2 + 200 * Math.pow(Math.random(), 3),
        color: s.color,
      });
    }
  }
  return {
    title: "One simulated collision event: energy clusters, bubble area = energy (GeV)",
    dataSet, gravity: 0.06, padding: 0.5,
    // Chunked async settle + fewer ticks: the multi-second force layout runs in
    // ~12ms slices behind the chart's loading overlay instead of freezing the page.
    layoutMode: "async", settleTicks: 200,
  };
}
</script>

BubbleChart có tùy chọn `renderer="webgpu"` để vẽ đám mây bong bóng dưới dạng các vòng tròn theo instance trên GPU trong khi nhãn và tooltip vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas, và `getContext().renderer` báo cáo bất kỳ renderer nào thực sự đã vẽ.

Giống trang biểu đồ phân tán, demo bên dưới cũng mượn cảm hứng từ vật lý hạt: ~1.500 cụm năng lượng tái dựng từ một sự kiện va chạm mô phỏng, mỗi cụm một bong bóng, tô màu theo hệ đo. Vài cú va đập mạnh vượt hẳn hàng nghìn cụm mềm, và cách xếp trọng lực biến toàn bộ ngân sách năng lượng của sự kiện thành một đám mây dễ đọc.

<WebgpuHeavyDemo element="michi-vz-bubble-chart" :make="makeBubble" :legend="[
    { label: 'Tracker', color: '#457b9d' },
    { label: 'ECAL', color: '#2a9d8f' },
    { label: 'HCAL', color: '#e07b39' },
    { label: 'Muon chambers', color: '#9b5de5' },
  ]" caption="~1.500 cụm năng lượng mô phỏng" />

## Xem dữ liệu chạy theo năm

Gắn `date` cho từng bong bóng rồi bật `timeline`: đám mây bong bóng thành câu chuyện theo từng năm với nút play và thanh tua riêng, mỗi lần hiển thị kích thước của một giai đoạn. Mặc định tắt - không bật thì biểu đồ giữ nguyên.

<TimelinePlayDemo chart="bubble-chart" hint="Bấm nút play dưới biểu đồ: dữ liệu chạy qua từng năm, mỗi lần một snapshot. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<BubbleChartHandle>(null);

<BubbleChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<BubbleChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:bubbleChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyBubbleChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-bubble-chart id="c"></michi-vz-bubble-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` chỉnh nhịp chạy, `loop` quay vòng, `autoplay: true` tự chạy khi mount, `showControl: false` ẩn thanh điều khiển có sẵn.
- Giá trị trượt mượt giữa các giai đoạn theo mặc định (`interpolate`); chỉnh chuyển động bằng `tweenMs` và `easing`, hoặc đặt `interpolate: false` để cắt thẳng. Khi bật reduced motion, biểu đồ luôn cắt thẳng.
- Controller headless luôn sẵn sàng: `chart.timeline()` cho `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, kèm `onStep` và `formatPeriod` trong config khi cần tự dựng UI.
- `filter` (top-N, sắp xếp) vẫn áp dụng bên trong từng giai đoạn, nên mỗi năm chỉ giữ lại top 5 bong bóng.
- Bong bóng không có `date` hiển thị ở mọi giai đoạn.

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

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
