---
title: Cây tỏa tròn
description: "Một sơ đồ cụm/dendrogram tỏa tròn: các lá nằm cách đều tâm, với các vòng tròn được thu phóng ở cả cấp nhóm và cấp lá. Mật độ nhãn thích ứng (viết tắt/cắt ngắn/ẩn/xoay) khi số lá tăng lên, cùng tiêu đề trung tâm tùy chọn tự động xuống dòng. SVG, canvas, và một lớp WebGPU ủy quyền."
---
# Cây tỏa tròn

<span class="vp-badge tip">Cấu trúc</span>

Biểu đồ #21 - biểu đồ mới cuối cùng trong quá trình di trú sdg-trade: một sơ đồ cụm/dendrogram tỏa tròn. Mục tiêu di trú cho **TreeRadial** cũ của sdg-trade - các nhóm tỏa ra từ một điểm trung tâm, các lá của mỗi nhóm nằm trên "nan hoa" tỏa tròn riêng, mỗi lá đều nằm ở CÙNG khoảng cách với tâm (một dendrogram thực thụ - xem [ghi chú hành vi](#cluster-khong-phai-tree) bên dưới).

<ChartDemo chart="radial-tree-chart" :legend="[]" />

Càng nhiều lá càng vượt qua các ngưỡng mật độ nhãn thích ứng - nhãn được viết tắt và xoay theo hướng tỏa tròn, rồi biến mất hoàn toàn khi cây trở nên rất dày đặc:

<ChartDemo chart="radial-tree-chart" :index="1" :legend="[]" />

> Biểu đồ trên là **cùng một engine** trên mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Hình dạng phản chiếu Treemap

`RadialTreeNode` cố tình phản chiếu hình dạng của [`TreemapNode`](/vi/charts/treemap) - `label` / `code` / `value` / `color` / `children` - để nhất quán API giữa hai biểu đồ phân cấp. Nhóm màu của một nút là label của tổ tiên CẤP CAO NHẤT của nó, giống hệt Treemap: một lá kế thừa màu của nhóm trừ khi chính nó (hoặc nhóm) đặt `color` riêng.

```ts
import { RadialTreeChart } from "@michi-vz/react";

<RadialTreeChart
  centerLabel="Tổng giá trị thương mại"
  dataSet={[
    {
      label: "Nông nghiệp",
      children: [
        { label: "Cà phê", value: 8 },
        { label: "Trà", value: 5 },
        // ...
      ],
    },
    // ...
  ]}
/>
```

Giá trị riêng của một nhóm LUÔN LUÔN là tổng các con của nó (một `value` được khai báo rõ ràng trên một nút có `children` sẽ bị bỏ qua) - vì vậy bạn chỉ cần cung cấp giá trị cho các lá.

## Cách dùng

::: code-group

```tsx [React]
import { RadialTreeChart } from "@michi-vz/react";

export default () => <RadialTreeChart {...props} />; // props = tùy chọn biểu đồ
```

```vue [Vue]
<script setup>
import { RadialTreeChart } from "@michi-vz/vue";
</script>

<template>
  <RadialTreeChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { radialTreeChart } from "@michi-vz/svelte";
</script>

<div use:radialTreeChart={props}></div>
```

```ts [Angular]
// main.ts - đăng ký các phần tử một lần
import "@michi-vz/angular";
import { applyRadialTreeChartProps } from "@michi-vz/angular";

// component (dùng CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-radial-tree-chart #c></michi-vz-radial-tree-chart>
applyRadialTreeChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-radial-tree-chart id="c"></michi-vz-radial-tree-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountRadialTreeChart } from "@michi-vz/core";

const chart = mountRadialTreeChart(el, props);
chart.update(next);
chart.getContext(); // không phụ thuộc renderer, sẵn sàng cho LLM
chart.destroy();
```

:::

## API

Props được định kiểu là `RadialTreeChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc renderer.

## Ghi chú hành vi

### cluster(), không phải tree()

Bố cục được xây dựng bằng `cluster()` của d3-hierarchy - đã được xác minh khớp với lệnh gọi chính xác của biểu đồ cũ - KHÔNG PHẢI `tree()`. `cluster()` đặt mọi LÁ ở cùng khoảng cách tỏa tròn tính từ tâm bất kể nhánh của nó có bao nhiêu cấp, điều này khiến đây là một dendrogram thực thụ; `tree()` thay vào đó sẽ định kích thước mỗi nhánh theo độ sâu cây con riêng của nó, khiến các lá ở độ sâu khác nhau nằm ở bán kính khác nhau.

### Vòng tròn hai cấp, một thang tuyến tính

Cả vòng tròn NHÓM (thu phóng theo tổng của nhóm) và mỗi vòng tròn LÁ (thu phóng theo giá trị riêng) đều được vẽ từ CÙNG một thang tuyến tính (đã xác minh khớp với `scaleLinear` của biểu đồ cũ - không phải thang căn bậc hai) trên miền kết hợp giá trị của mọi nhóm VÀ mọi lá. `radiusRange` (mặc định `[2, 32]`, `circleRange` cũ) đặt phạm vi đầu ra của thang đo.

### Mật độ nhãn thích ứng

Nhãn phản ứng theo tổng số LÁ thông qua `labelDensityThresholds`:

- Dưới `rotateAbove` (mặc định 20): mọi nút hiển thị tên đầy đủ; ở mật độ thấp đến trung bình, tên của một nhóm cấp cao nhất còn bị cắt ngắn còn 10 ký tự khi số lượng vượt quá một nửa `rotateAbove` (một đặc điểm cũ được giữ lại - lá không bao giờ bị cắt ngắn theo cách này).
- Vượt qua `rotateAbove`: mọi nhãn được viết tắt còn 3 chữ cái + "." và xoay theo hướng tỏa tròn thay vì giữ nằm ngang.
- Vượt qua `hideAbove` (mặc định 100): không có nhãn nào được vẽ.

### Tự động xuống dòng cho centerLabel

`centerLabel` (`titleCenter` cũ) vẽ một vòng tròn nhỏ ở giữa (bằng một phần tư bán kính ngoài) với văn bản tự động xuống dòng sau khoảng 10 ký tự - một phiên bản đơn giản hóa, tất định của thuật toán xuống dòng dựa trên độ rộng pixel của biểu đồ cũ.

### Liên kết

Mỗi nút vẽ một liên kết cong (đường cong Bézier bậc ba) trở về nút cha - các "nan hoa" tỏa tròn của dendrogram - được chuyển thể từ công thức điểm điều khiển của biểu đồ cũ. Các liên kết được vẽ thành một lớp nền duy nhất, vì vậy liên kết không bao giờ che khuất vòng tròn về mặt hình ảnh (một đơn giản hóa thuần túy về mặt thẩm mỹ, được ghi chú, so với cách lồng DOM theo từng nút của biểu đồ cũ).

### Lồng sâu hơn 2 cấp

Hợp đồng với người dùng là 2 cấp (nhóm + lá), nhưng lồng sâu hơn vẫn được chấp nhận: mỗi cấp bổ sung vẫn có vòng tròn được thu phóng và một liên kết, `onDataWarning` sẽ báo (`excess-depth`), và các quy tắc mật độ nhãn vẫn được áp dụng (quy tắc cắt ngắn chỉ dành cho cấp 1 sẽ ngừng áp dụng dưới cấp cao nhất).

### Kết xuất: SVG, canvas, và WebGPU ủy quyền

`renderer="svg"` (mặc định) vẽ một `<circle class="radial-tree-node-circle">` cho mỗi nút. `renderer="canvas"` vẽ cùng các dấu đó lên canvas 2D, phân giải màu tô qua cùng cơ chế dò CSS của người dùng mà mọi biểu đồ một-dấu sử dụng. `renderer="webgpu"` **ủy quyền** cho bộ kết xuất canvas-2D, cùng lý do như Choropleth Map / Symbol Map: các liên kết của dendrogram là đường cong Bézier, nên việc tam giác hóa GPU chính xác là công việc không tương xứng ở đây.

### Đang tải / không có dữ liệu

`isLoading` và `isNodata` điều khiển lớp phủ (React: `isLoadingComponent` / `isNodataComponent`), giống hệt mọi biểu đồ khác trong thư viện.

> **Cơ chế màu do người dùng kiểm soát:** context mang theo `legendData` (`{ label, color, dataLabelSafe }`, một dòng cho mỗi nhóm cấp cao nhất) để hệ thống màu tiêm CSS có thể nhắm mục tiêu quy tắc theo từng label; `onChartDataProcessed` chỉ được phát ra khi context **thay đổi**.
