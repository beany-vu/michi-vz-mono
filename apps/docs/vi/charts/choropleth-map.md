---
title: Bản đồ phân cấp màu
description: "Bản đồ phân cấp màu thế giới/khu vực: GeoJSON của riêng bạn, được tô màu theo thang màu ngưỡng hoặc một bản đồ danh mục rõ ràng. 13 phép chiếu d3-geo/d3-geo-projection; SVG, canvas và một lớp WebGPU ủy quyền."
---
# Bản đồ phân cấp màu

<span class="vp-badge tip">Địa lý</span>

Biểu đồ **địa lý** đầu tiên của thư viện: tô màu một bản đồ thế giới hoặc khu vực theo giá trị. Dữ liệu liên tục (giá trị xuất khẩu, một chỉ số, một tỷ phần) điều khiển thang màu ngưỡng; dữ liệu danh mục (một nhóm "năm dữ liệu gần nhất có sẵn", một trạng thái) điều khiển một bản đồ nhãn → màu rõ ràng. Địa lý **luôn luôn là một prop** - gói này không đóng gói sẵn dữ liệu topology nào; bạn nhập GeoJSON thế giới/khu vực của riêng mình và truyền thẳng vào.

<ChartDemo chart="choropleth-map-chart" :legend="[]" />

Chế độ danh mục - `colorsMapping` thắng `colorScale` (trường hợp sử dụng **Data Availability** của sdg-trade: một vài nhóm nhãn → màu cố định, không phải một dải màu số):

<ChartDemo chart="choropleth-map-chart" :index="1" :legend="[]" />

> Biểu đồ ở trên là **cùng một engine** trong mọi framework - chỉ có mã tích hợp bên dưới là khác nhau.

## Mang theo dữ liệu địa lý của riêng bạn

`geography` chấp nhận hoặc một `FeatureCollection` GeoJSON đầy đủ, hoặc một `GeoFeatureItem[]` đã được chuẩn hóa sẵn (`{ id, geometry, name? }`). Không có gì về các hình dạng được đóng gói sẵn trong `@michi-vz/core` - nhập một bản đồ thế giới một lần trong ứng dụng của bạn và tái sử dụng nó cho mọi bản đồ phân cấp màu:

```ts
import worldJson from "./world.json"; // FeatureCollection GeoJSON của riêng bạn
import { ChoroplethMapChart } from "@michi-vz/react";

<ChoroplethMapChart
  geography={worldJson}
  dataSet={[
    { id: "USA", label: "United States", value: 2450 },
    { id: "DEU", label: "Germany", value: 1870 },
    // ...
  ]}
  colorScale={{ domain: [500, 1000, 2000], range: ["#eaf3fb", "#5b9bd5", "#123a63"] }}
/>
```

`id` của mỗi feature trong một `FeatureCollection` được đọc từ `Feature.id` GeoJSON cấp cao nhất (dự phòng bằng `properties.id`); `name` từ `properties.name`. Các nguồn phổ biến: [world-atlas](https://github.com/topojson/world-atlas) (TopoJSON - chuyển đổi bằng `feature()` của `topojson-client`), [Natural Earth](https://www.naturalearthdata.com/), hoặc một tệp khu vực do chính đội của bạn duy trì. Docs/ví dụ của gói này chỉ đóng gói một mẫu minh họa nhỏ gồm 12 hình dạng - không phải đường bờ biển thật - để giữ cho thư viện không phụ thuộc vào bất kỳ dữ liệu topology nào.

## Cách dùng

::: code-group

```tsx [React]
import { ChoroplethMapChart } from "@michi-vz/react";

export default () => <ChoroplethMapChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { ChoroplethMapChart } from "@michi-vz/vue";
</script>

<template>
  <ChoroplethMapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { choroplethMapChart } from "@michi-vz/svelte";
</script>

<div use:choroplethMapChart={props}></div>
```

```ts [Angular]
// main.ts - đăng ký các elements một lần
import "@michi-vz/angular";
import { applyChoroplethMapChartProps } from "@michi-vz/angular";

// component (dùng CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-choropleth-map-chart #c></michi-vz-choropleth-map-chart>
applyChoroplethMapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-choropleth-map-chart id="c"></michi-vz-choropleth-map-chart>
<script>
  Object.assign(document.getElementById("c"), props); // geography, dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountChoroplethMapChart } from "@michi-vz/core";

const chart = mountChoroplethMapChart(el, props);
chart.update(next);
chart.getContext(); // độc lập với renderer, sẵn sàng cho LLM
chart.destroy();
```

:::

## API

Các prop được định kiểu là `ChoroplethMapChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer.

## Ghi chú về hành vi

### Khớp `dataSet` với `geography` - `joinBy`

Mỗi hàng `dataSet` (`{ id, label, value?, color? }`) được khớp với một feature địa lý qua `joinBy`: `"id"` (mặc định) khớp `ChoroplethDataItem.id` với `GeoFeatureItem.id` / `Feature.id` GeoJSON - phép khớp sạch, ổn định (ví dụ mã ISO-A3). `"name"` khớp `label` với `GeoFeatureItem.name` / `properties.name` thay vào đó, cho dữ liệu được đánh chỉ mục theo tên quốc gia thay vì mã. Một feature không có hàng khớp (hoặc một hàng nằm trong `disabledItems`) sẽ được vẽ bằng `noDataColor` và tooltip của nó nhận dạng dự phòng `{ id, name }` thay vì toàn bộ hàng.

### Thứ tự ưu tiên khi phân giải màu

`colorsMapping[label]` (danh mục, rõ ràng) thắng `colorScale` (liên tục - một `range` hex đã phân giải + một `domain` số, được xây dựng trong một `scaleThreshold` của d3; các giá trị ngoài domain sẽ kẹp về màu đầu/cuối của range) thắng `color` riêng của hàng thắng bảng màu `colors` được tự động gán. Core không phụ thuộc vào `d3-scale-chromatic` - hãy truyền các màu hex đã phân giải sẵn vào `colorScale.range`, tự tạo chúng từ một scheme có tên (hoặc ở bất cứ đâu khác) trong ứng dụng của riêng bạn nếu muốn.

### Các phép chiếu - đủ 13, một mặc định

`projection` phân phối tới `geoEqualEarth`, `geoMercator`, `geoTransverseMercator`, `geoAlbers`, `geoAlbersUsa`, `geoAzimuthalEqualArea`, `geoAzimuthalEquidistant`, `geoOrthographic`, `geoConicConformal`, `geoConicEqualArea`, `geoConicEquidistant`, `geoRobinson` (mặc định), và `geoGilbert` (cả hai từ `d3-geo-projection`). `projectionConfig` (`scale`, `rotate`, `center`, `parallels`) tinh chỉnh phép chiếu đã chọn; các trường bị bỏ qua sẽ dùng giá trị mặc định của chính biểu đồ `MapChoropleth` cũ của sdg-trade (`rotate: [-18, 0]`, `center: [0, 10]`, một tỷ lệ suy ra từ chiều rộng) thay vì `projection.fitSize` - điều này tái tạo chính xác kết quả hình ảnh của biểu đồ đó thay vì canh khung lại theo cách khác. `geoAlbersUsa` là một phép chiếu tổng hợp cố định: nó bỏ qua `rotate` / `center` / `parallels`.

### Kết xuất: SVG, canvas và một WebGPU được ủy quyền

`renderer="svg"` (mặc định) vẽ một `<path class="region">` cho mỗi feature. `renderer="canvas"` vẽ qua `geoPath(projection, ctx)` - d3-geo kết xuất trực tiếp và hiệu quả vào một context canvas 2D, nên không có gì phải phân tích lại chuỗi path SVG hay triển khai lại toán học phép chiếu. `renderer="webgpu"` **ủy quyền** cho cùng bộ kết xuất canvas-2D thay vì tam giác hóa các đa giác tùy ý trên GPU: các khu vực thực tế thường lõm, nhiều vòng, có lỗ (một vùng lãnh thổ tách rời, một cụm đảo), và việc tam giác hóa GPU chính xác cho các đa giác đơn giản tùy ý đòi hỏi kỹ thuật ear-clipping thực sự - không tương xứng so với việc kết xuất 2D gốc đã nhanh của d3-geo cho một biểu đồ thường chỉ có vài chục đến vài trăm đường path. Nó vẫn được kiểm soát theo khả năng (`navigator.gpu`) và báo cáo renderer thực tế qua `getContext().renderer`, giống như mọi biểu đồ khác.

### Di chuột / tooltip

`tooltipFormatter(d)` nhận toàn bộ `ChoroplethDataItem` cho một khu vực được khớp, hoặc `{ id, name }` cho một khu vực không khớp. Ở chế độ canvas/webgpu, việc di chuột được giải quyết bằng cách chiếu lại hình học thô của mỗi feature và chạy phép kiểm tra điểm-trong-đa-giác (không phải một xấp xỉ hộp bao), nên các biên giới không đều vẫn được phát hiện chính xác. Di chuột làm mờ mọi khu vực khác (hành vi `highlightItems` chuẩn của thư viện) thay vì một viền `:hover` CSS thường trực đậm hơn - hiệu ứng di chuột của biểu đồ cũ.

### Đang tải / không có dữ liệu

`isLoading` và `isNodata` điều khiển lớp phủ (React: `isLoadingComponent` / `isNodataComponent`), giống hệt mọi biểu đồ khác trong thư viện.

> **Cơ quan quyết định màu sắc của consumer:** ngữ cảnh mang theo `legendData` (`{ label, color, dataLabelSafe }`) để một hệ thống màu tiêm CSS có thể dùng làm khóa cho các quy tắc theo từng nhãn; `onChartDataProcessed` chỉ được phát ra khi ngữ cảnh **thay đổi**.
