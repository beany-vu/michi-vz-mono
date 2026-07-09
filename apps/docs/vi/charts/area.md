---
title: Biểu đồ vùng
description: "Biểu đồ vùng chồng thể hiện cấu thành theo thời gian: theo dõi tỷ phần của mỗi danh mục trong tổng thể mở rộng hoặc thu hẹp khi tổng tăng lên."
---
# Biểu đồ vùng

<span class="vp-badge tip">Cấu thành</span>

Tổng đang tăng, nhưng lát nào đang thúc đẩy điều đó? Chồng các danh mục của bạn lại và theo dõi tỷ phần của mỗi danh mục trong tổng thể mở rộng hay thu hẹp theo thời gian, để một con nước dâng và một cơ cấu đang dịch chuyển cùng kể câu chuyện của chúng.

<ChartDemo chart="area-chart" />

> Biểu đồ ở trên là **cùng một engine** trong mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Khi nào nên dùng

- **Cơ cấu theo thời gian, khi tổng thể cũng quan trọng.** Các dải chồng lên nhau cho thấy tỷ trọng từng nhóm, còn mép trên vẽ ra tổng: vừa thấy nước lên, vừa thấy cơ cấu dịch chuyển, tất cả trong một hình.
- **Kể câu chuyện "cơ cấu đang thay đổi".** Một dải mỏng dần trong khi tổng vẫn tăng là thông điệp không bảng tính nào truyền đạt nhanh bằng: rất hợp với báo cáo doanh thu theo sản phẩm hay lưu lượng theo kênh.
- **Khi thứ hạng đổi chỗ, hãy đổi biểu đồ.** Nếu câu chuyện là ai vượt ai, [biểu đồ dải](/vi/charts/ribbon) thể hiện các cú hoán đổi rõ ràng hơn; còn nếu chỉ xét một thời điểm, [biểu đồ tròn](/vi/charts/pie) là đủ.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeArea() {
  const keys = ["Coal", "Natural gas", "Nuclear", "Wind", "Solar"];
  const base = { Coal: 1500, "Natural gas": 1100, Nuclear: 800, Wind: 180, Solar: 30 };
  const drift = { Coal: -0.6, "Natural gas": 0.3, Nuclear: 0.02, Wind: 0.4, Solar: 0.5 };
  const series = [];
  const rows = 1500;
  for (let i = 0; i < rows; i++) {
    const row = { date: i };
    for (const k of keys) {
      const trend = base[k] + drift[k] * i;
      const noise = (Math.sin(i * 0.37 + k.length) + Math.random() - 0.5) * base[k] * 0.03;
      row[k] = Math.max(0, trend + noise);
    }
    series.push(row);
  }
  return { series, keys, xAxisDataType: "number" };
}

function makeNoDataArea() {
  const keys = ["Raw", "Semi-processed", "Processed"];
  // 24 months, but 2022-04/05/09 and 2023-02/03 are MISSING from the data.
  const present = [
    "2022-01", "2022-02", "2022-03", "2022-06", "2022-07", "2022-08",
    "2022-10", "2022-11", "2022-12", "2023-01", "2023-04", "2023-05",
    "2023-06", "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  ];
  const series = present.map((date, i) => ({
    date,
    Raw: 20 + Math.round(Math.sin(i / 3) * 8),
    "Semi-processed": 30 + Math.round(Math.cos(i / 2) * 6),
    Processed: 50 + Math.round(Math.sin(i / 4) * 5),
  }));
  return {
    series,
    keys,
    xAxisDataType: "date_monthly",
    colorsMapping: { Raw: "#2c6fbb", "Semi-processed": "#e07b39", Processed: "#3aa757" },
    xAxisFormat: (d) => {
      const dt = new Date(Number(d));
      return (
        dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) +
        " " +
        String(dt.getUTCFullYear()).slice(2)
      );
    },
    noDataTickTooltip: () => "No data reported for this month",
  };
}
</script>

AreaChart có tùy chọn `renderer="webgpu"` để vẽ các dải chồng trên GPU trong khi trục, nhãn và tooltip vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas.

<WebgpuHeavyDemo legend element="michi-vz-area-chart" :make="makeArea" caption="~7,500 points" />

## Trục thời gian liên tục & các mốc không có dữ liệu

Trục x luôn giữ **kỳ đầu tiên và cuối cùng** và nghiêng / thu gọn các nhãn dày đặc xuống còn ~5. Chọn dùng `fillPeriodTicks` để vẽ một mốc cho **mỗi** tháng trong phạm vi; các tháng không có dữ liệu sẽ hiển thị **mờ** kèm tooltip khi di chuột "no data". Bật/tắt nó:

<NoDataTicksDemo element="michi-vz-area-chart" :make="makeNoDataArea" />

Tùy chỉnh qua `noDataTickTooltip(epochMs)` (nội dung tooltip) và `noDataTickColor` (hoặc biến CSS `--michi-vz-tick-nodata`).

::: code-group

```tsx [React]
<AreaChart
  {...props}
  xAxisDataType="date_monthly"
  fillPeriodTicks
  noDataTickTooltip={() => "No data reported for this month"}
  noDataTickColor="#c0392b"
/>
```

```vue [Vue]
<AreaChart :options="{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }" />
```

```svelte [Svelte]
<div use:areaChart={{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }}></div>
```

```ts [Angular]
applyAreaChartProps(this.c.nativeElement, {
  ...props,
  fillPeriodTicks: true,
  noDataTickTooltip: () => "No data",
});
```

```html [Web component]
<michi-vz-area-chart id="c" fill-period-ticks no-data-tick-color="#c0392b"></michi-vz-area-chart>
<script>
  document.getElementById("c").noDataTickTooltip = () => "No data reported";
</script>
```

:::

## Hiệu ứng vẽ dần

Biểu đồ tự vẽ dần từ trái sang phải ngay khi mount, hiện lần lượt các nét vẽ trước khi ổn định vào vị trí. Mặc định tắt - không bật thì biểu đồ giữ nguyên như cũ.

<RevealDemo chart="area-chart" replay-label="Chạy lại hiệu ứng" hint="Mỗi đường lớn dần từ năm đầu đến năm cuối; nhãn bám theo ngọn đường rồi dừng ở điểm cuối. Khi hệ điều hành bật reduced motion, biểu đồ hiển thị đầy đủ ngay lập tức." />

`progressiveDraw: true` dùng cấu hình mặc định (1200 ms, easeInOutCubic). Truyền object để tinh chỉnh:

::: code-group

```tsx [React]
const ref = useRef<AreaChartHandle>(null);

<AreaChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() chạy lại hiệu ứng khi cần
```

```vue [Vue]
<AreaChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:areaChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyAreaChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-area-chart id="c"></michi-vz-area-chart>
<script>
  const el = document.getElementById("c");
  el.progressiveDraw = { durationMs: 2000 };
  // el.replay() chạy lại hiệu ứng
</script>
```

:::

- `durationMs` và `easing` ("linear", "easeOutQuad", "easeInOutCubic", hoặc hàm `(t) => t` tự viết) quyết định nhịp vẽ.
- `autoplay: false` hiển thị biểu đồ vẽ sẵn đầy đủ; gọi `replay()` (ref handle bên React, method của web component, hoặc instance của core) để chạy hiệu ứng khi cần. `replayOnUpdate: true` chạy lại mỗi lần dữ liệu thay đổi.
- Tôn trọng `prefers-reduced-motion`: biểu đồ hiển thị đầy đủ ngay, không animation.

## Xem dữ liệu chạy theo năm

Dữ liệu vốn đã trải dài qua nhiều năm nên không cần gắn thêm gì cả. Bật `timeline`: nút play và thanh tua riêng của biểu đồ chạy qua các năm đó, mỗi bước các dải chồng chỉ vẽ đến năm đang active rồi khi chạy tiếp sẽ nối dài mượt mà thêm ra. Kéo lùi thanh tua thì các dải cũng co lại tương ứng. Hover chỉ soi được phần đã thực sự vẽ ra. Mặc định tắt - không bật thì biểu đồ giữ nguyên.

<TimelinePlayDemo chart="area-chart" hint="Bấm nút play dưới biểu đồ: biểu đồ vẽ dần đến từng năm khi chạy qua. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<AreaChartHandle>(null);

<AreaChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<AreaChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:areaChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyAreaChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-area-chart id="c"></michi-vz-area-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` chỉnh nhịp chạy, `loop` quay vòng, `autoplay: true` tự chạy khi mount, `showControl: false` ẩn thanh điều khiển có sẵn.
- Controller headless luôn sẵn sàng: `chart.timeline()` cho `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, kèm `onStep` và `formatPeriod` trong config khi cần tự dựng UI.
- Giá trị trượt mượt giữa các năm theo mặc định (`interpolate`); đặt `interpolate: false` để cắt thẳng. Khi bật reduced motion, biểu đồ luôn cắt thẳng.
- `timeline` được ưu tiên hơn `progressiveDraw` khi cả hai cùng được bật trên một biểu đồ.

## Cách dùng

::: code-group

```tsx [React]
import { AreaChart } from "@michi-vz/react";

export default () => <AreaChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { AreaChart } from "@michi-vz/vue";
</script>

<template>
  <AreaChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { areaChart } from "@michi-vz/svelte";
</script>

<div use:areaChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyAreaChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-area-chart #c></michi-vz-area-chart>
applyAreaChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-area-chart id="c"></michi-vz-area-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountAreaChart } from "@michi-vz/core";

const chart = mountAreaChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `AreaChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer.
