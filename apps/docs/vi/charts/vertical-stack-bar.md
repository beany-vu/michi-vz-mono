---
title: Biểu đồ cột chồng dọc
description: "Biểu đồ cột chồng dọc cho cơ cấu qua các danh mục, với một cơ chế bảo vệ tường minh đánh dấu các đoạn thiếu thay vì làm phẳng chúng về 0."
---
# Biểu đồ cột chồng dọc

<span class="vp-badge tip">Cơ cấu</span>

"Mỗi danh mục được cấu thành từ gì, và cơ cấu đó thay đổi ra sao qua các danh mục?" Xếp chồng các phần trong một cột cho mỗi danh mục, và cơ cấu hiện ra chỉ trong nháy mắt. Khi một đoạn bị thiếu, một cơ chế bảo vệ tường minh đánh dấu khoảng trống đó thay vì âm thầm làm phẳng nó về 0.

<ChartDemo chart="vertical-stack-bar-chart" />

Cần so sánh hai thứ cạnh nhau? Truyền **nhiều hơn một chuỗi** trong `dataSet` và các cột sẽ **gộp nhóm**: mỗi danh mục trục x, bạn có một cột chồng cho mỗi chuỗi, được xếp cạnh nhau. Ở đây, hai khu vực qua ba năm, mỗi cột chia thành năm dòng sản phẩm - để bạn đọc được khu vực nào lớn hơn *và* cơ cấu của nó khác nhau ra sao, cùng một lúc:

<ChartDemo chart="vertical-stack-bar-chart" :index="1" />

> Biểu đồ ở trên là **cùng một engine** trên mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeVsb() {
  const keys = ["Cloud", "Hardware", "Licenses", "Services", "Support"];
  const base = { Cloud: 40, Hardware: 60, Licenses: 50, Services: 30, Support: 20 };
  const drift = { Cloud: 3.2, Hardware: -0.4, Licenses: 0.6, Services: 1.8, Support: 0.3 };
  const series = [];
  for (let i = 0; i < 150; i++) {
    const row = { date: String(2000 + i) };
    for (const k of keys) {
      const noise = (Math.random() - 0.5) * 8;
      row[k] = Math.max(1, base[k] + drift[k] * i * 0.1 + noise);
    }
    series.push(row);
  }
  const dataSet = [
    {
      seriesKey: "Global",
      seriesKeyAbbreviation: "GLB",
      series,
    },
  ];
  return { dataSet, keys, keysOrder: "bottomToTop" };
}
</script>

VerticalStackBarChart có `renderer="webgpu"` tùy chọn, vẽ các cột của nó trên GPU trong khi trục, nhãn và tooltip vẫn nằm trên lớp SVG. Tính năng này được kiểm soát theo khả năng phần cứng: trên trình duyệt không có WebGPU, nó tự động hạ cấp về canvas, và `getContext().renderer` báo cáo bộ dựng thực sự đã vẽ.

<WebgpuHeavyDemo legend element="michi-vz-vertical-stack-bar-chart" :make="makeVsb" caption="~150 cột × 5 khóa" />

## Cách dùng

::: code-group

```tsx [React]
import { VerticalStackBarChart } from "@michi-vz/react";

export default () => <VerticalStackBarChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { VerticalStackBarChart } from "@michi-vz/vue";
</script>

<template>
  <VerticalStackBarChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { verticalStackBarChart } from "@michi-vz/svelte";
</script>

<div use:verticalStackBarChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyVerticalStackBarChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-vertical-stack-bar-chart #c></michi-vz-vertical-stack-bar-chart>
applyVerticalStackBarChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-vertical-stack-bar-chart id="c"></michi-vz-vertical-stack-bar-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountVerticalStackBarChart } from "@michi-vz/core";

const chart = mountVerticalStackBarChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Các prop được định kiểu là `VerticalStackBarChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc bộ dựng.

## Ghi chú hành vi

Các hành vi này là tự động (không cần cấu hình thêm) và khớp với biểu đồ `michi-vz` cũ để tương đồng khi thay thế trực tiếp.

### Trục x dày đặc - tự động xoay / thu gọn

Trục dạng dải đo các nhãn của nó và tự thích ứng: **nằm ngang** khi vừa đủ chỗ, **xoay −45°** (vẫn hiển thị tất cả nhãn) khi không vừa, và **thu gọn** về một tập con cách đều nhau chỉ khi mật độ quá cao. Lề dưới được dành sẵn tự động để các nhãn xoay không bao giờ bị cắt. Không cần prop nào - truyền `xAxisFormat` để định dạng văn bản mốc (ví dụ `202401` → `01-2024`).

### `date` chấp nhận số

`date` của một hàng có thể là một `number` (ví dụ `date: 2024`) hoặc một chuỗi; engine sẽ ép kiểu bằng `String()`. Thang dải là `scaleBand<string>`, nên các kiểu hỗn hợp được chuẩn hóa nhất quán.

### `keysOrder` và thứ tự màu

`keysOrder` (`"topToBottom"` mặc định | `"bottomToTop"`) chọn đầu nào của chồng cột `keys[0]` sẽ nằm. Với `"bottomToTop"`, **thứ tự chú giải / màu bị đảo ngược** so với thứ tự vẽ chồng - do đó một thành phần quản lý màu của consumer gán màu theo thứ tự xuất hiện trong `legendData` sẽ gắn khóa vị trí 0 với khóa *trên cùng*, chứ không phải khóa dưới cùng. Thứ tự vẽ chồng (pixel) được quyết định độc lập và không bị ảnh hưởng.

### `filter` - nhóm Top/Bottom-N

`filter = { limit, sortingDir }` xếp hạng các **DataSet** (nhóm) theo tổng lớn của chúng trên tất cả các hàng + khóa và giữ lại `limit` nhóm đứng đầu (`"desc"`) hoặc cuối (`"asc"`). Mọi thứ phía sau (khóa, ngày, miền y, cột và chú giải) đều bắt nguồn từ tập đã lọc, nên chú giải luôn phản ánh chính xác các cột được vẽ.

### `disabledItems`

Các tên trong `disabledItems` loại bỏ cả **khóa đoạn** khớp lẫn **nhóm DataSet**. Vô hiệu hóa một nhóm khiến các cột còn lại **rộng ra** để chia đều dải giữa các nhóm còn hiển thị.

### `tooltipFormatter`

Nhận `{ item, key, seriesKey, series, isMissing }` - `item` là toàn bộ hàng dữ liệu, `key` là đoạn đang được trỏ chuột vào, `series` là các hàng của đoạn đó qua các ngày. Tooltip có sẵn **nhận biết mép biên**: nó lật sang bên trái con trỏ khi gần mép phải và tụt xuống dưới con trỏ khi gần mép trên, nên không bao giờ tràn ra ngoài màn hình.

### Tương tác (canvas)

Di chuột vào một đoạn làm mờ các đoạn khác **ngay trong cùng khung hình** (không có độ trễ đầu vào); rời khỏi biểu đồ sẽ xóa hiệu ứng mờ. **Nhấp** vào một cột để ghim tooltip, nhấp lại để ghim lại, và nhấp ra ngoài biểu đồ để bỏ ghim.
