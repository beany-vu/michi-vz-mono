---
title: Biểu đồ hình quạt
description: "Biểu đồ hình quạt cho các dự báo có độ bất định: lịch sử bằng đường đặc, đường khả dĩ nhất bằng nét đứt, và các dải tin cậy mở rộng dần vào tương lai."
---
# Biểu đồ hình quạt

<span class="vp-badge tip">Xu hướng</span> <span class="vp-badge tip">Dự báo</span>

**"Doanh thu quý tới sẽ là bao nhiêu?"** Câu trả lời trung thực không bao giờ là một con số duy nhất - đó là một *khoảng*, và khoảng đó chính là điểm mấu chốt. Đưa cho một giám đốc một con số duy nhất là bạn đang đoán mò; đưa cho họ hình quạt này là bạn đang nói thật về rủi ro. Đường đặc là những gì đã xảy ra, đường nét đứt là con đường khả dĩ nhất duy nhất, và các dải bóng mờ cho thấy dự báo chắc chắn đến mức nào - mở rộng dần khi vươn vào tương lai, vì càng nhìn xa, càng ít ai biết chắc được.

<ChartDemo chart="fan-chart" :height="380" />

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeFan() {
  const n = 1500;
  const dataSet = [];
  const bands = [];
  let level = 100;
  const cutoff = Math.round(n * 0.85);
  for (let i = 0; i < n; i++) {
    level += (Math.random() - 0.48) * 2 + Math.sin(i / 40) * 0.6;
    const certainty = i < cutoff;
    dataSet.push({ date: i, value: Math.round(level * 100) / 100, certainty });
    if (!certainty) {
      const h = i - cutoff + 1;
      const spread = Math.sqrt(h) * 1.8;
      bands.push({ date: i, valueMin: Math.round((level - spread) * 100) / 100, valueMax: Math.round((level + spread) * 100) / 100, valueMedium: Math.round(level * 100) / 100 });
    } else {
      bands.push({ date: i, valueMin: level, valueMax: level, valueMedium: level });
    }
  }
  return {
    dataSet: [
      {
        label: "Revenue",
        color: "#2563eb",
        series: dataSet,
        bands: [{ level: 0.95, series: bands }],
      },
    ],
    xAxisDataType: "number",
    fillOpacity: 0.22,
  };
}
</script>

FanChart có tùy chọn `renderer="webgpu"` để vẽ các mark đường và dải trên GPU trong khi trục, nhãn và tooltip vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas, và `getContext().renderer` báo cáo bất kỳ renderer nào thực sự đã vẽ.

<WebgpuHeavyDemo element="michi-vz-fan-chart" :make="makeFan" caption="~1,500 points" />

## Cách đọc biểu đồ

- **Đường đặc - lịch sử.** Các số liệu thực tế bạn đã có.
- **Đường nét đứt - con đường khả dĩ nhất** (*trung vị* dự báo): một dự đoán tốt nhất, không bao giờ là toàn bộ câu chuyện.
- **Các dải lồng nhau - độ tin cậy.** Từ trong ra ngoài = **50% / 80% / 95%**. Giá trị thực tế nên rơi vào bên trong dải 95% khoảng **19 trên 20 lần**. Bạn lập kế hoạch dựa trên dải, không phải dựa trên đường.
- **Vì sao nó loe rộng ra.** Tháng tới khá dễ biết trước; một năm sau thì không. Độ bất định tích lũy theo khoảng cách, nên các dải mở rộng dần.

> Đọc **kịch bản xấu nhất** ở đáy của dải ngoài cùng và **kịch bản tốt nhất** ở đỉnh. Hình quạt cho bạn thấy cơ sở / khả quan / bất lợi trong một bức tranh duy nhất - không cần một tab kịch bản riêng.

## Toán học đằng sau, nói theo cách đơn giản

Bạn không cần các phương trình để dùng biểu đồ này, nhưng đây là những gì diễn ra bên trong - và vì sao bạn có thể tin tưởng nó:

- **Trung vị** đến từ phép làm mịn hàm mũ **Holt-Winters**. Nó theo dõi hai đại lượng biến đổi, **mức** hiện tại và **xu hướng** (độ dốc), rồi lăn chúng về phía trước; nếu chuỗi có tính mùa vụ lặp lại, nó cũng theo dõi luôn điều đó. (Thích một đường thẳng hơn? `method: "linear"` sẽ khớp một hồi quy bình phương tối thiểu thông thường thay thế.)
  > `ℓₜ = α·yₜ + (1−α)(ℓₜ₋₁ + bₜ₋₁)` · `bₜ = β(ℓₜ − ℓₜ₋₁) + (1−β)bₜ₋₁` · `ŷₜ₊ₕ = ℓₜ + h·bₜ`
- **Các dải** đến từ *chính các sai số quá khứ* của mô hình. Nó đo mức các giá trị đã khớp lệch bao xa (độ trải dư `σ`) và mở rộng khoảng theo `ŷ ± z·σ·√h` - `z = 1.96` cho mức 95%, và `√h` chính là lý do vì sao hình quạt mở rộng theo tầm nhìn `h`.
- **Bạn có nên tin nó không?** Một phép **kiểm tra ngược (backtest)** ẩn đi vài điểm thực gần nhất, dự báo lại chúng, và báo cáo sai số (`MAPE`, `RMSE`). Bạn nhận được một điểm số về độ trung thực *trước khi* đặt cược vào con số, chứ không phải sau đó.

Tất cả đều chạy **ngay trong trình duyệt** - không cần backend khoa học dữ liệu, không cần round-trip máy chủ. (Power BI, ngược lại, chỉ dự báo trên một biểu đồ đường và dừng lại ở nơi mô hình hóa thực sự bắt đầu.)

> Dựng dữ liệu chỉ trong một lệnh gọi bằng `forecastFan()` từ [`@michi-vz/insights/forecast`](/vi/guide/insights), hoặc tự truyền vào `series` (lịch sử + trung vị `certainty:false`) và các `bands` lồng nhau.

## Hiệu ứng vẽ dần

Biểu đồ tự vẽ dần từ trái sang phải ngay khi mount, hiện lần lượt các nét vẽ trước khi ổn định vào vị trí. Mặc định tắt - không bật thì biểu đồ giữ nguyên như cũ.

<RevealDemo chart="fan-chart" replay-label="Chạy lại hiệu ứng" hint="Mỗi đường lớn dần từ năm đầu đến năm cuối; nhãn bám theo ngọn đường rồi dừng ở điểm cuối. Khi hệ điều hành bật reduced motion, biểu đồ hiển thị đầy đủ ngay lập tức." />

`progressiveDraw: true` dùng cấu hình mặc định (1200 ms, easeInOutCubic). Truyền object để tinh chỉnh:

::: code-group

```tsx [React]
const ref = useRef<FanChartHandle>(null);

<FanChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() chạy lại hiệu ứng khi cần
```

```vue [Vue]
<FanChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:fanChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyFanChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-fan-chart id="c"></michi-vz-fan-chart>
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

Dữ liệu vốn đã trải dài qua nhiều năm nên không cần gắn thêm gì cả. Bật `timeline`: nút play và thanh tua riêng của biểu đồ chạy qua các năm đó, mỗi bước đường lịch sử, đường trung vị dự báo và các dải tin cậy chỉ vẽ đến năm đang active rồi khi chạy tiếp sẽ nối dài mượt mà thêm ra. Kéo lùi thanh tua thì mọi thứ cũng co lại tương ứng. Hover chỉ soi được phần đã thực sự vẽ ra. Mặc định tắt - không bật thì biểu đồ giữ nguyên.

<TimelinePlayDemo chart="fan-chart" hint="Bấm nút play dưới biểu đồ: biểu đồ vẽ dần đến từng năm khi chạy qua. Kéo thanh tua để nhảy đến năm bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<FanChartHandle>(null);

<FanChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<FanChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:fanChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyFanChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-fan-chart id="c"></michi-vz-fan-chart>
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

```ts [Insights (one call)]
import { mountFanChart } from "@michi-vz/core";
import { forecastFan } from "@michi-vz/insights/forecast";

// history = DataPoint[] of actuals; build the fan (median + 50/80/95% bands)
const item = forecastFan(history, { method: "holt-winters", horizon: 4, levels: [0.5, 0.8], level: 0.95 }, "Revenue");
const chart = mountFanChart(el, { dataSet: [item], xAxisDataType: "date_annual" });
```

```ts [Vanilla JS]
import { mountFanChart } from "@michi-vz/core";

const chart = mountFanChart(el, props); // props.dataSet = FanDataItem[]
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-fan-chart id="c"></michi-vz-fan-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet (series + bands), title, …
</script>
```

:::

## Cấu trúc dữ liệu

Một `FanDataItem` là một chuỗi đường quen thuộc cộng thêm các dải lồng nhau:

```ts
interface FanDataItem {
  label: string;
  color?: string;
  series: DataPoint[];   // history (certainty:true) then forecast median (certainty:false → dashed)
  bands: { level: number; series: RangeDataPoint[] }[]; // drawn widest-first, graduated opacity
}
```

## API

Các prop được định kiểu là `FanChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) và phản chiếu `LineChartProps` (`width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer`, `highlightItems`, `disabledItems`, `fillOpacity`, và các callback `on*`). `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer.
