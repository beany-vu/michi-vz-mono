---
title: Bản đồ ký hiệu
description: "Một bản đồ ký hiệu/bong bóng khử chồng lấn bằng mô phỏng lực d3-force một lần: bạn cung cấp lng/lat cho mỗi mục. Mặc định chỉ có chấm (tương đồng với bản cũ); có tùy chọn nền địa hình mờ nhạt. SVG, canvas và một lớp WebGPU ủy quyền."
---
# Bản đồ ký hiệu

<span class="vp-badge tip">Địa lý</span>

Biểu đồ #20: một bản đồ bong bóng khử chồng lấn bằng mô phỏng lực. Mục tiêu di trú cho **MapSymbolForce** cũ của sdg-trade - một bản đồ bong bóng chỉ-có-chấm, trong đó tọa độ của mỗi mục được chiếu lên mặt phẳng, sau đó một mô phỏng lực một lần đẩy các vòng tròn chồng lấn ra vừa đủ để dễ đọc, mà không di chuyển chúng xa khỏi vị trí thực. Khác với [Bản đồ phân cấp màu](/vi/charts/choropleth-map), địa lý ở đây là **tùy chọn**: bỏ qua nó để có diện mạo chỉ-có-chấm của biểu đồ cũ (mặc định), hoặc cung cấp nó để vẽ một nền địa hình mờ nhạt phía sau các ký hiệu.

<ChartDemo chart="symbol-map-chart" :legend="[]" />

Một vòng thứ hai đồng tâm (`valueSecond`) được đọc như một chỉ số con của vòng tròn ngoài - ví dụ "trong đó" một đối tác hoặc kênh cụ thể:

<ChartDemo chart="symbol-map-chart" :index="1" :legend="[]" />

## Vị trí chính xác hay tách chồng lấn

`positionMode` quyết định ý nghĩa vị trí của mỗi symbol:

- **`"force"` (mặc định, giữ tương thích legacy)**: mô phỏng một lần đẩy các vòng tròn chồng nhau tách ra. Dễ đọc khi nhiều symbol dồn về một chỗ, nhưng symbol có thể lệch khỏi tọa độ thật, và trên biểu đồ nhỏ độ lệch có thể rất lớn.
- **`"precise"`**: mỗi symbol nằm đúng tại `lng`/`lat` đã chiếu; chấp nhận chồng lấn.

Symbol vẽ nhầm sang nước khác là lỗi chính xác bản đồ, với nhiều đối tượng người xem còn là vấn đề nhạy cảm chính trị. Nên dùng `"precise"` khi có nền `geography`: thấy đất liền là người xem sẽ đọc vị trí theo nghĩa đen.

<PositionModeDemo labelPrecise="precise: vị trí thật" labelForce="force: tách chồng lấn" hint="Chuyển sang force để thấy các bong bóng lệch khỏi tọa độ thật nhằm tránh va chạm. Khi có nền bản đồ, precise thường là lựa chọn trung thực hơn." />

::: warning Bản đồ chỉ để minh họa
Atlas thế giới trên trang này là file GeoJSON đơn giản hóa thuộc phạm vi công cộng, đi kèm ví dụ tài liệu chỉ để minh họa. Đường biên giới, tên gọi và hình dạng KHÔNG mang tính chính thức. Hãy rà soát biên giới và tên gọi trong file `geography` của bạn theo chính sách bản đồ của tổ chức trước khi dùng thật: thư viện vẽ nguyên trạng file được truyền vào, không hiệu chỉnh gì.
:::

> Biểu đồ ở trên là **cùng một engine** trong mọi framework - chỉ mã tích hợp bên dưới là khác.

## Mang theo tọa độ của riêng bạn

Khác với biểu đồ cũ (vốn đóng gói một CSV tĩnh khoảng 200 dòng tọa độ quốc gia), `@michi-vz/core` **không** đóng gói bảng tọa độ nào. Mỗi mục `dataSet` tự cung cấp `lng`/`lat` riêng:

```ts
import { SymbolMapChart } from "@michi-vz/react";

<SymbolMapChart
  dataSet={[
    { id: "usa", label: "United States", lng: -95.7, lat: 38.9, value: 100 },
    { id: "deu", label: "Germany", lng: 13.4, lat: 52.5, value: 60, valueSecond: 30 },
    // ...
  ]}
/>
```

Vì phạm vi (extent) dùng để khớp bố cục chỉ-có-chấm với vùng vẽ được suy ra từ tọa độ của chính tập dữ liệu của bạn (không phải từ một bảng thế giới luôn đầy đủ được đóng gói sẵn), "thế giới" mà biểu đồ vẽ ra chỉ trải rộng đến mức các điểm bạn truyền vào - xem [Ghi chú hành vi](#chiếu-chỉ-có-chấm-so-với-nền) bên dưới.

## Xem dữ liệu chạy theo năm

Gắn `date` cho từng ký hiệu rồi bật `timeline`: bản đồ thành câu chuyện theo từng năm với nút play và thanh tua riêng, mỗi lần đặt các ký hiệu của một giai đoạn. Mặc định tắt - không bật thì biểu đồ giữ nguyên.

<TimelinePlayDemo chart="symbol-map-chart" hint="Bấm nút play dưới biểu đồ: dữ liệu chạy qua từng năm, mỗi lần một snapshot. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<SymbolMapChartHandle>(null);

<SymbolMapChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<SymbolMapChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:symbolMapChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applySymbolMapChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-symbol-map-chart id="c"></michi-vz-symbol-map-chart>
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
- Ký hiệu không có `date` hiển thị ở mọi giai đoạn.

## Cách dùng

::: code-group

```tsx [React]
import { SymbolMapChart } from "@michi-vz/react";

export default () => <SymbolMapChart {...props} />; // props = các tùy chọn biểu đồ
```

```vue [Vue]
<script setup>
import { SymbolMapChart } from "@michi-vz/vue";
</script>

<template>
  <SymbolMapChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { symbolMapChart } from "@michi-vz/svelte";
</script>

<div use:symbolMapChart={props}></div>
```

```ts [Angular]
// main.ts - đăng ký các phần tử một lần
import "@michi-vz/angular";
import { applySymbolMapChartProps } from "@michi-vz/angular";

// component (sử dụng CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-symbol-map-chart #c></michi-vz-symbol-map-chart>
applySymbolMapChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-symbol-map-chart id="c"></michi-vz-symbol-map-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, title, …
</script>
```

```ts [Vanilla JS]
import { mountSymbolMapChart } from "@michi-vz/core";

const chart = mountSymbolMapChart(el, props);
chart.update(next);
chart.getContext(); // độc lập với renderer, sẵn sàng cho LLM
chart.destroy();
```

:::

## API

Các thuộc tính được định kiểu là `SymbolMapChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc thử nghiệm `"webgpu"`), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer.

## Ghi chú hành vi

### Khử chồng lấn bằng lực một lần

`lng`/`lat` của mỗi mục được chiếu tới một vị trí pixel "thực"; `forceX`/`forceY` ghim mô phỏng vào đúng vị trí đó làm mục tiêu, `forceManyBody()` thêm một chút tách biệt nhẹ, và `forceCollide` (bán kính + đệm 2px, 3 lần lặp) mới là thứ thực sự đẩy các vòng tròn chồng lấn ra xa nhau. Mô phỏng ổn định đồng bộ tới CÙNG ngưỡng alpha mà biểu đồ cũ đã dùng (`0.0011`) - có tính xác định: đầu vào giống nhau luôn ổn định về cùng một bố cục, vì vậy hai lần dựng cùng dữ liệu cho ra vị trí giống hệt nhau đến từng pixel. Hai mục có tọa độ *hoàn toàn giống nhau* bắt đầu chồng lên nhau và tách ra gọn gàng khi mô phỏng ổn định.
`positionMode: "precise"` bỏ qua hoàn toàn mô phỏng: mỗi symbol giữ nguyên vị trí chiếu chính xác của nó và chấp nhận chồng lấn (xem demo chuyển chế độ ở trên).

### Chiếu chỉ-có-chấm so với nền

Khi không có `geography`, `projection` được chọn (mặc định `"geoMercator"`, giống biểu đồ cũ) được dùng ở dạng **chưa tinh chỉnh** - một factory chiếu trần trụi không có bất kỳ tinh chỉnh translate/scale/rotate/center nào như [Bản đồ phân cấp màu](/vi/charts/choropleth-map) - và phạm vi các điểm đã chiếu sau đó được co giãn lại để lấp đầy vùng vẽ, phản ánh đúng công thức riêng của biểu đồ cũ. Khi cung cấp `geography`, CÙNG cơ chế điều phối đã tinh chỉnh mà Bản đồ phân cấp màu dùng sẽ thay thế, để nền địa hình và tọa độ ký hiệu chia sẻ một khung địa lý nhất quán (không co giãn phạm vi).

### `radiusVisibleMin` - lọc trên giá trị thô

`radiusVisibleMin` ẩn các mục có `value` **thô** bằng hoặc dưới ngưỡng (và, khi `valueSecond` được đặt, có `valueSecond` cũng dưới ngưỡng đó) **trước khi** bố cục lực chạy - được chuyển thể từ bộ lọc riêng của biểu đồ cũ, vốn so sánh giá trị thô, chưa bao giờ so sánh bán kính đã co giãn. Miền của thang bán kính/độ mờ vẫn được xây dựng từ mọi mục có tọa độ hợp lệ bất kể bộ lọc này, để bán kính của một ký hiệu vẫn có thể so sánh được giữa các lần dựng ngay cả khi ngưỡng thay đổi.

### Vòng thứ hai đồng tâm

`valueSecond` vẽ một vòng tròn thứ hai, cùng màu với vòng ngoài, ở `opacity - 0.3` (giới hạn không âm), vẽ ĐÈ LÊN vòng tròn chính - chuyển thể chính xác từ cách phân lớp riêng của `ForceNode` cũ. Khi vòng tròn thứ hai nhỏ hơn vòng ngoài, nó đọc như một lõi mờ hơn bên trong một vòng sáng hơn (ví dụ "trong đó"); khi lớn hơn, nó che phủ hoàn toàn vòng tròn ngoài.

### Nền địa lý tùy chọn

`geography` (một `FeatureCollection` GeoJSON hoặc một `GeoFeatureItem[]` đã chuẩn hóa sẵn, cùng hợp đồng như `geography` của Bản đồ phân cấp màu) là một khả năng **mới** - biểu đồ cũ chưa bao giờ vẽ địa hình. Bỏ qua nó để có diện mạo chỉ-có-chấm của bản cũ; cung cấp nó để có một nền mờ nhạt, không tương tác (`geographyColor`, mặc định `#eef1f5`) phía sau các ký hiệu.

### Kết xuất: SVG, canvas và một WebGPU ủy quyền

`renderer="svg"` (mặc định) vẽ một `<circle class="symbol">` cho mỗi mục hiển thị (cộng với một `<circle class="symbol-second">` tùy chọn). `renderer="canvas"` vẽ cùng các ký hiệu đó lên canvas 2D, phân giải màu tô qua cùng một đầu dò CSS phía người dùng mà mọi biểu đồ ký hiệu đơn dùng. `renderer="webgpu"` **ủy quyền** cho renderer canvas-2D, cùng lý do như Bản đồ phân cấp màu: nền tùy chọn là GeoJSON tùy ý (có thể lõm, nhiều vòng), nên việc tam giác hóa GPU chính xác là phạm vi không tương xứng ở đây.

### Đang tải / không có dữ liệu

`isLoading` và `isNodata` điều khiển lớp phủ (React: `isLoadingComponent` / `isNodataComponent`), giống hệt mọi biểu đồ khác trong hệ thống.

> **Thẩm quyền màu phía người dùng:** ngữ cảnh mang theo `legendData` (`{ label, color, dataLabelSafe }`) để một hệ thống màu tiêm CSS có thể khóa các quy tắc theo từng nhãn; `onChartDataProcessed` chỉ được phát ra khi ngữ cảnh **thay đổi**.
