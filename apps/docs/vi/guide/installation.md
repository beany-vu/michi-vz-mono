# Cài đặt

`@michi-vz` được phát hành lên npm dưới scope [**@michi-vz**](https://www.npmjs.com/org/michi-vz). Chỉ cần cài đặt một gói cho stack của bạn - các wrapper framework sẽ tự động kéo theo engine (`@michi-vz/core`). Mỗi tên gói bên dưới liên kết tới trang npm của nó.

| Stack | Gói | Peer dependencies |
| --- | --- | --- |
| React | [`@michi-vz/react`](https://www.npmjs.com/package/@michi-vz/react) | `react` & `react-dom` >= 18 |
| Vue | [`@michi-vz/vue`](https://www.npmjs.com/package/@michi-vz/vue) | `vue` >= 3 |
| Svelte | [`@michi-vz/svelte`](https://www.npmjs.com/package/@michi-vz/svelte) | `svelte` >= 4 |
| Angular | [`@michi-vz/angular`](https://www.npmjs.com/package/@michi-vz/angular) | `@angular/core` >= 16 |
| Web component | [`@michi-vz/wc`](https://www.npmjs.com/package/@michi-vz/wc) | không có (tự chứa) |
| Vanilla / engine | [`@michi-vz/core`](https://www.npmjs.com/package/@michi-vz/core) | không có (d3 được đóng gói sẵn) |

## Cài đặt

::: code-group

```bash [React]
npm i @michi-vz/react
```

```bash [Vue]
npm i @michi-vz/vue
```

```bash [Svelte]
npm i @michi-vz/svelte
```

```bash [Angular]
npm i @michi-vz/angular
```

```bash [Web component]
npm i @michi-vz/wc
```

```bash [Vanilla JS]
npm i @michi-vz/core
```

:::

> Các ví dụ dùng **npm**; `pnpm add`, `yarn add`, và `bun add` hoạt động y hệt.

## Peer dependencies

Các wrapper framework khai báo framework của chúng như một **peer dependency** - cài đặt nó (hoặc đảm bảo ứng dụng của bạn đã có sẵn) cùng với wrapper, để bạn kiểm soát phiên bản:

::: code-group

```bash [React]
npm i @michi-vz/react react react-dom
```

```bash [Vue]
npm i @michi-vz/vue vue
```

```bash [Svelte]
npm i @michi-vz/svelte svelte
```

```bash [Angular]
npm i @michi-vz/angular @angular/core
```

:::

`@michi-vz/wc` và `@michi-vz/core` **không có peer dependency nào** - mọi thứ chúng cần (d3-scale/d3-shape, DOMPurify) đều được đóng gói sẵn.

## CDN / không cần build

Với một bản dựng thử, một CodePen, hay một trang HTML thuần, hãy tải web component thẳng từ CDN - không cần bundler:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [{ date: 2016, value: 10, certainty: true }] },
  ];
</script>
```

> Ghim một phiên bản chính (major) để đảm bảo ổn định, ví dụ `@michi-vz/wc@1`. Gói CDN chứa **mọi** phần tử, nên cho môi trường production nên cài đặt gói và chỉ import những biểu đồ bạn dùng (các sub-path theo từng phần tử có thể tree-shake được).

## Styles

Engine tự động chèn một `core.css` nhỏ (layout, tooltip, transitions) ngay lần đầu tiên một biểu đồ được mount - **bạn không cần import CSS nào cả**. Nó cố tình không thiết lập **`fill`/`stroke`**: màu sắc là hợp đồng của bạn. Tô màu cho các mark theo nhãn đã được làm sạch (sanitized) trong stylesheet của riêng bạn:

```css
.line[data-label-safe="North"] { stroke: #b23a2e; }
.bar[data-label-safe="Africa"] { fill: #cda14a; }
```

Vì biểu đồ render trong **light DOM**, CSS của bạn tiếp cận được mọi mark - kể cả các điểm ảnh canvas, thông qua một probe `getComputedStyle`.

## Bước tiếp theo

- **[Render biểu đồ đầu tiên của bạn](/vi/guide/getting-started)** - hướng dẫn nhanh theo từng framework.
- **[Duyệt qua các biểu đồ](/vi/charts/)** - 16 ví dụ, mỗi ví dụ một trang.
- **[Tham chiếu API](/vi/api/line)** - props, sự kiện, và `getContext()` cho từng biểu đồ.
- **[LLM context](/vi/guide/llm-context)** - `ChartContext` không phụ thuộc renderer mà mỗi biểu đồ phát ra.
