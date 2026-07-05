# Bắt đầu

`@michi-vz` là một thư viện biểu đồ không phụ thuộc framework: một **engine** TypeScript
thuần (`@michi-vz/core`), **web component** gốc (`@michi-vz/wc`), và các wrapper mỏng
**React / Vue / Svelte / Angular**. Mỗi biểu đồ render bằng **SVG hoặc canvas** (cộng với
một đường render **WebGPU** thử nghiệm) và phát ra một **`ChartContext` sẵn sàng cho LLM**.

## Cài đặt

Chọn gói cho stack của bạn - chi tiết đầy đủ, peer dependency, và tùy chọn CDN nằm trong **[Cài đặt](/vi/guide/installation)**:

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
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

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

Biểu đồ render vào **light DOM** để CSS của consumer tiếp cận được mọi mark - kể cả các
điểm ảnh canvas, thông qua một probe `getComputedStyle`. Tô màu cho các mark theo nhãn đã
được làm sạch:

```css
.line[data-label-safe="North"] { stroke: #b23a2e; }
.bar[data-label-safe="Africa"] { fill: #cda14a; }
```

`@michi-vz/core/styles.css` chỉ xử lý layout/tooltip - nó không bao giờ thiết lập
`fill`/`stroke`, vì màu sắc là hợp đồng của bạn.

## Bước tiếp theo nên đi đâu

- **Chọn một biểu đồ** trong [thư viện](/vi/charts/) - mỗi trang biểu đồ đều có một demo
  trực tiếp, các tab theo framework, và một liên kết tới tham chiếu prop đầy đủ của nó.
- **Đang phân vân liệu thư viện này có hợp với bạn?** [Vì sao chọn michi-vz](/vi/guide/why)
  - điều gì thực sự khác biệt, và nơi chúng tôi thẳng thắn về giới hạn.
- **Gỡ lỗi những gì bạn xây dựng** với [bảng DevTools](/vi/guide/devtools) - kích thước,
  thang đo (scale), so sánh khác biệt trạng thái, và một kiểm toán khả năng truy cập cho
  bất kỳ biểu đồ nào trên trang.
- **Làm cho biểu đồ dự đoán và tự giải thích chính mình** với [Insights](/vi/guide/insights)
  - dự báo, bất thường, tường thuật, tất cả ngay trong trình duyệt với
  [phương pháp luận được trình bày chi tiết](/vi/guide/insights#methodology---the-exact-logic-behind-every-insight).
- **Kết nối biểu đồ với một trợ lý AI** qua [LLM context](/vi/guide/llm-context) và MCP.
