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
// A nod to particle physics: a simulated LHC-style dimuon spectrum. Resonances
// (J/psi, psi(2S), the three Upsilons) sit as sharp vertical bands over a falling
// continuum background - structure you can only see when all 50k events render.
function makeScatter() {
  const g = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pT = () => {
    // Falling pT spectrum; resample the rare high tail instead of clamping
    // (a clamp piles points into a fake line at the top of the plot).
    let v;
    do { v = -8 * Math.log(1 - Math.random()); } while (v > 48);
    return v;
  };
  const resonances = [
    { label: "J/ψ", color: "#e63946", mass: 3.097, width: 0.07, n: 9000 },
    { label: "ψ(2S)", color: "#f4a261", mass: 3.686, width: 0.08, n: 2200 },
    { label: "Υ(1S)", color: "#2a9d8f", mass: 9.46, width: 0.1, n: 5200 },
    { label: "Υ(2S)", color: "#457b9d", mass: 10.023, width: 0.11, n: 2600 },
    { label: "Υ(3S)", color: "#9b5de5", mass: 10.355, width: 0.11, n: 1500 },
  ];
  const dataSet = [];
  const colorsMapping = { "Continuum μμ": "#b8bdc7" };
  // Background FIRST so the resonance points paint on top of it, not under it.
  for (let i = 0; i < 29500; i++) {
    // Continuum: density falls toward high mass, like the real background.
    dataSet.push({ label: "Continuum μμ", x: 2 + 10 * Math.pow(Math.random(), 2.2), y: pT() });
  }
  for (const r of resonances) {
    colorsMapping[r.label] = r.color;
    for (let i = 0; i < r.n; i++) {
      dataSet.push({ label: r.label, x: r.mass + g() * r.width, y: pT() });
    }
  }
  return {
    title: "Simulated dimuon events: invariant mass (GeV) vs pT (GeV)",
    dataSet, colorsMapping,
    xAxisDataType: "number", xAxisDomain: [2, 12], yAxisDomain: [0, 50], sizeRange: [2, 2],
  };
}
</script>

ScatterChart có `renderer="webgpu"` tùy chọn, vẽ đám mây điểm thành các vòng tròn do GPU dựng hàng loạt trong khi trục, nhãn và tooltip vẫn nằm trên lớp SVG. Tính năng này được kiểm soát theo khả năng phần cứng: trên trình duyệt không có WebGPU, nó tự động hạ cấp về canvas, và `getContext().renderer` báo cáo bộ dựng thực sự đã vẽ.

Demo bên dưới là một lời chào gửi tới vật lý hạt: 50.000 sự kiện dimuon mô phỏng trên nền continuum giảm dần. Những dải dọc sắc nét là các cộng hưởng J/ψ, ψ(2S) và Υ(1S/2S/3S), đúng cấu trúc mà một phổ dimuon ở LHC cho thấy, và chính là loại đám mây điểm mà bộ dựng GPU sinh ra để xử lý.

<WebgpuHeavyDemo element="michi-vz-scatter-chart" :make="makeScatter" legend caption="50.000 sự kiện dimuon mô phỏng" />

## Xem dữ liệu chạy theo năm

Chiêu kinh điển kiểu Gapminder: gắn `date` cho từng điểm, bật `timeline`, rồi xem đám điểm dịch chuyển qua từng năm với nút play và thanh tua có sẵn. Mặc định tắt - không bật thì biểu đồ giữ nguyên.

<TimelinePlayDemo chart="scatter" hint="Bấm nút play dưới biểu đồ: các điểm dịch chuyển qua từng năm. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<ScatterChartHandle>(null);

<ScatterChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<ScatterChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:scatterChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyScatterChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-scatter-chart id="c"></michi-vz-scatter-chart>
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
- Kết hợp với `pointLabels` để mỗi bong bóng luôn có tên khi di chuyển; `filter` vẫn áp dụng bên trong từng giai đoạn.
- Điểm không có `date` hiển thị ở mọi giai đoạn.

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

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
