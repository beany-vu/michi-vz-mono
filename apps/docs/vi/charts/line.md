---
title: Biểu đồ đường
description: "Biểu đồ đường cho dữ liệu chuỗi thời gian: một chuỗi hay năm mươi chuỗi, các giai đoạn thiếu dữ liệu được vẽ bằng nét đứt, cùng bộ dựng canvas tùy chọn với thuật toán giảm mẫu LTTB cho hàng nghìn điểm dữ liệu."
---
# Biểu đồ đường

<span class="vp-badge tip">Xu hướng</span>

"Số liệu này biến động ra sao theo thời gian, và ở đâu thì không nên tin tưởng dữ liệu?" Một chuỗi hay năm mươi chuỗi đều được, với các giai đoạn thiếu dữ liệu được vẽ bằng nét đứt để một khoảng trống báo cáo không bao giờ bị hiểu nhầm thành một đợt sụt giảm thật - cộng thêm bộ dựng canvas tùy chọn (giảm mẫu bằng LTTB cho dữ liệu lớn) khi số điểm lên tới hàng nghìn.

<ChartDemo chart="line-chart" />

> Biểu đồ ở trên là **cùng một engine** trên mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeLine() {
  const seriesLabels = [
    { label: "Germany", color: "#1f9e57" },
    { label: "United Kingdom", color: "#2c6fbb" },
    { label: "France", color: "#e63946" },
    { label: "Spain", color: "#e9c46a" },
    { label: "Italy", color: "#2a9d8f" },
    { label: "Poland", color: "#9b5de5" },
    { label: "Sweden", color: "#f4a261" },
    { label: "Netherlands", color: "#264653" },
  ];
  const POINTS_PER_SERIES = 2000;
  const START_YEAR = 1900;
  const dataSet = seriesLabels.map((s, si) => {
    let value = 20 + si * 5;
    const series = [];
    for (let i = 0; i < POINTS_PER_SERIES; i++) {
      value += (Math.random() - 0.5) * 2;
      value = Math.max(0, Math.min(100, value));
      series.push({
        date: START_YEAR + i,
        value: Math.round(value * 100) / 100,
        certainty: true,
      });
    }
    return { label: s.label, color: s.color, series };
  });
  return { dataSet, xAxisDataType: "date_annual", showDataPoints: false };
}

function makeNoDataLine() {
  // 24 months of Jan 2022 - Dec 2023, but several months are MISSING from the data
  // (2022-04/05/09, 2023-02/03) so the "fill" toggle has real gaps to reveal.
  const present = [
    "2022-01", "2022-02", "2022-03", "2022-06", "2022-07", "2022-08",
    "2022-10", "2022-11", "2022-12", "2023-01", "2023-04", "2023-05",
    "2023-06", "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  ];
  const mk = (base, amp) =>
    present.map((date, i) => ({
      date,
      value: Math.round((base + Math.sin(i / 2) * amp) * 10) / 10,
      certainty: true,
    }));
  return {
    dataSet: [
      { label: "Exports", color: "#2c6fbb", series: mk(60, 12) },
      { label: "Imports", color: "#e07b39", series: mk(45, 9) },
    ],
    xAxisDataType: "date_monthly",
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

`renderer="webgpu"` tùy chọn của biểu đồ đường vẽ hình học đường/marker trên GPU, trong khi trục, nhãn và tooltip vẫn nằm trên lớp SVG; tính năng này được kiểm soát theo khả năng phần cứng, tự động chuyển về canvas khi WebGPU không khả dụng.

<WebgpuHeavyDemo element="michi-vz-line-chart" :make="makeLine" caption="~16.000 điểm" />

## Phát hiện khoảng trống

Một giai đoạn thiếu dữ liệu được vẽ thành đoạn **nét đứt** - đặt riêng cho từng điểm bằng `certainty: false`, hoặc để `detectGaps` tự suy ra. Ở đây một chuỗi bỏ qua một kỳ báo cáo:

<ChartDemo chart="line-chart" :index="1" />

## Trục thời gian liên tục & các mốc không có dữ liệu

Mặc định, trục x trung thực với thời gian theo hai cách: **kỳ đầu và kỳ cuối không bao giờ bị bỏ** (kể cả khi chúng rơi vào một tháng "lẻ" mà d3 thường sẽ bỏ qua), và các nhãn dày đặc nghiêng -45° rồi thưa dần còn khoảng 5 nhãn - luôn giữ lại cả hai đầu.

Bật `fillPeriodTicks` và trục sẽ vẽ một mốc cho **mọi** kỳ trong phạm vi, không chỉ những kỳ có dữ liệu. Các tháng không có giá trị được hiển thị **mờ đi**; di chuột vào để xem giải thích cho khoảng trống. Bật thử công tắc:

<NoDataTicksDemo :make="makeNoDataLine" />

Tùy chỉnh: `noDataTickTooltip(epochMs)` trả về nội dung tooltip (chuỗi thường hoặc HTML đã được làm sạch), và `noDataTickColor` (hoặc biến CSS `--michi-vz-tick-nodata`) đặt màu mờ.

::: code-group

```tsx [React]
<LineChart
  {...props}
  xAxisDataType="date_monthly"
  fillPeriodTicks
  noDataTickTooltip={() => "No data reported for this month"}
  noDataTickColor="#c0392b"
/>
```

```vue [Vue]
<LineChart :options="{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }" />
```

```svelte [Svelte]
<div use:lineChart={{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }}></div>
```

```ts [Angular]
applyLineChartProps(this.c.nativeElement, {
  ...props,
  fillPeriodTicks: true,
  noDataTickTooltip: () => "No data",
});
```

```html [Web component]
<michi-vz-line-chart id="c" fill-period-ticks no-data-tick-color="#c0392b"></michi-vz-line-chart>
<script>
  document.getElementById("c").noDataTickTooltip = () => "No data reported";
</script>
```

:::

## Cách dùng

::: code-group

```tsx [React]
import { LineChart } from "@michi-vz/react";

export default () => <LineChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { LineChart } from "@michi-vz/vue";
</script>

<template>
  <LineChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { lineChart } from "@michi-vz/svelte";
</script>

<div use:lineChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyLineChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-line-chart #c></michi-vz-line-chart>
applyLineChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-line-chart id="c"></michi-vz-line-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Trạng thái đang tải và không có dữ liệu

Truyền `isLoading` trong khi việc lấy dữ liệu của bạn đang chạy; engine sẽ hiển thị lớp phủ `.mv-loading` và đặt `data-mv-state="loading"` trên host.

Khi việc lấy dữ liệu hoàn tất mà không trả về gì, `isNodata` sẽ tiếp quản. Điều kiện mặc định coi `dataSet` rỗng (hoặc mọi chuỗi đều rỗng) là không có dữ liệu - bạn có thể ghi đè bằng một boolean hoặc một hàm:

```tsx [React]
// boolean shortcut
<LineChart isLoading={query.isPending} isNodata={query.data?.length === 0} noDataLabel="No data available" />

// function predicate
<LineChart isNodata={(ds) => ds.every(s => s.data.length === 0)} />
```

Trong React, các prop `isNodataComponent` và `isLoadingComponent` chấp nhận bất kỳ `ReactNode` nào. Engine vẫn được mount (để `onChartDataProcessed` vẫn được kích hoạt); node của bạn được vẽ như một lớp phủ trên host của biểu đồ, và `suppressDefaultOverlay` được tự động đặt để ẩn thông báo `.mv-nodata` mặc định:

```tsx [React]
<LineChart
  isLoading={isPending}
  isLoadingComponent={<Spinner />}
  isNodata={isEmpty}
  isNodataComponent={<p className="no-data">No results for this selection.</p>}
/>
```

Với vanilla JS / các framework khác, lớp phủ mặc định được hiển thị theo mặc định. Ẩn nó đi và vẽ node của riêng bạn cạnh host của biểu đồ:

```ts [Vanilla JS]
const chart = mountLineChart(el, { ...props, suppressDefaultOverlay: true });
// render your overlay next to el when data-mv-state === "nodata"
```

## Cấu hình trục

| Prop | Mặc định | Hiệu ứng |
|---|---|---|
| `yTicks` | `10` | Số khoảng chia trên trục y |
| `showGridLines` | `true` | Lưới nét đứt ngang (y) |
| `showVerticalGridLines` | `false` | Lưới nét đứt dọc (x) |
| `highlightZeroLine` | `true` | Vẽ đường y = 0 dưới dạng nét liền |

Màu của đường zero mặc định theo màu lưới (`--michi-vz-grid`). Ghi đè độc lập:

```css
.my-chart-host {
  --michi-vz-zero-line: #e53935; /* solid red zero line */
  --michi-vz-grid: #e0e0e0;      /* dashed gridlines stay grey */
}
```

```tsx [React]
<LineChart
  yTicks={5}
  showGridLines={true}
  showVerticalGridLines={false}
  highlightZeroLine={true}
/>
```

## Font chữ

Truyền `fontFamily` để giữ nhãn SVG và văn bản canvas đồng bộ. Engine ghi `--michi-vz-font-family` lên host của biểu đồ; cả các phần tử `<text>` của SVG lẫn đường dựng `ctx.font` của canvas đều đọc computed style đó, nên không cần nhúng font - chỉ cần font đã được trang tải sẵn.

```tsx [React]
<LineChart fontFamily="Inter, sans-serif" />
```

```ts [Vanilla JS]
mountLineChart(el, { ...props, fontFamily: "Inter, sans-serif" });
```

## Màu sắc và dữ liệu chú giải

Màu của đường tuân theo **hợp đồng CSS `data-label-safe`**. Mỗi phần tử chuỗi mang một thuộc tính `data-label-safe` (nhãn chuỗi đã được làm sạch); bạn nhắm vào nó trong CSS để đặt màu nét vẽ. Bộ dựng canvas dò các computed style đó tại thời điểm vẽ, nên cùng một bộ quy tắc CSS điều khiển cả hai bộ dựng.

`onChartDataProcessed` (và `getContext()`) phát ra một mảng `legendData` trên [ChartContext](/vi/guide/llm-context). Mỗi mục có `{ label, color, order, disabled?, dataLabelSafe }`. Một thành phần quản lý màu (ví dụ một provider component) có thể đọc các mục này và phát ra CSS tương ứng:

```tsx [React]
<LineChart
  onChartDataProcessed={(ctx) => {
    ctx.legendData?.forEach(({ dataLabelSafe, color }) => {
      // write `.line[data-label-safe="${dataLabelSafe}"] { stroke: ${color} }` into a <style> tag
    });
  }}
/>
```

## API

Các prop được định kiểu là `LineChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc bộ dựng.
