# Bắt đầu

`@michi-vz` là một thư viện biểu đồ không phụ thuộc framework: một **engine** TypeScript
thuần (`@michi-vz/core`), **web component** gốc (`@michi-vz/wc`), và các wrapper mỏng
**React / Vue / Svelte / Angular**. Mỗi biểu đồ render bằng **SVG hoặc canvas** (cộng với
một đường render **WebGPU** thử nghiệm) và phát ra một **`ChartContext` sẵn sàng cho LLM**.

## Cài đặt

Chọn package phù hợp với stack của bạn. Chi tiết đầy đủ, peer dependency và tùy chọn dùng qua CDN có ở trang **[Cài đặt](/vi/guide/installation)**:

```bash
npm i @michi-vz/react
# or @michi-vz/vue  ·  @michi-vz/svelte  ·  @michi-vz/angular  ·  @michi-vz/wc  ·  @michi-vz/core
```

## Render một biểu đồ

::: code-group

```tsx [React]
import { LineChart } from "@michi-vz/react";

export default () => (
  <LineChart
    dataSet={[{ label: "North", series: [{ date: 2016, value: 10, certainty: true }] }]}
    xAxisDataType="date_annual"
  />
);
```

```html [Web component / no build]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [{ date: 2016, value: 10, certainty: true }] },
  ];
</script>
```

```ts [Imperative engine]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, { dataSet, width: 600, height: 300 });
chart.update(nextProps);
chart.getContext();
chart.destroy();
```

:::

## Hợp đồng màu sắc (light DOM)

Biểu đồ render vào **light DOM** nên CSS của consumer chạm được vào mọi mark, kể cả pixel
canvas, qua một probe `getComputedStyle`. Tô màu cho mark bằng nhãn đã sanitize:

```css
.line[data-label-safe="North"] { stroke: #b23a2e; }
.bar[data-label-safe="Africa"] { fill: #cda14a; }
```

`@michi-vz/core/styles.css` chỉ lo layout/tooltip, không bao giờ set `fill`/`stroke` vì
màu sắc là hợp đồng của bạn.

## Bước tiếp theo

- **Chọn một biểu đồ** trong [thư viện](/vi/charts/): mỗi trang đều có demo trực tiếp,
  các tab theo từng framework, và link tới tham chiếu prop đầy đủ.
- **Đang phân vân thư viện này có hợp với bạn không?** Đọc [Vì sao chọn michi-vz](/vi/guide/why)
  để biết điều gì thực sự khác biệt, và cả những giới hạn chúng tôi thẳng thắn nói ra.
- **Debug thứ bạn dựng** bằng [bảng DevTools](/vi/guide/devtools): kích thước, scale,
  so sánh khác biệt state, và audit accessibility cho bất kỳ biểu đồ nào trên trang.
- **Cho biểu đồ tự dự báo và tự giải thích** với [Insights](/vi/guide/insights): forecast,
  phát hiện bất thường, tường thuật, tất cả chạy ngay trong trình duyệt, với
  [cách tính được trình bày chi tiết](/vi/guide/insights#methodology---the-exact-logic-behind-every-insight).
- **Kết nối biểu đồ với trợ lý AI** qua [LLM context](/vi/guide/llm-context) và MCP.
