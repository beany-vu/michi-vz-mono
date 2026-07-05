# Cài đặt

`@michi-vz` được publish lên npm dưới scope [**@michi-vz**](https://www.npmjs.com/org/michi-vz). Bạn chỉ cần cài một package đúng stack của mình, các wrapper framework tự kéo theo engine (`@michi-vz/core`). Mỗi tên package bên dưới link thẳng tới trang npm của nó.

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

> Ví dụ dùng **npm**, nhưng `pnpm add`, `yarn add`, `bun add` dùng y hệt.

## Peer dependencies

Các wrapper framework khai báo framework của mình là **peer dependency**. Bạn cài nó (hoặc đảm bảo app đã có sẵn) cùng với wrapper, nhờ vậy bạn tự quyết định version:

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

`@michi-vz/wc` và `@michi-vz/core` **không có peer dependency nào**, mọi thứ chúng cần (d3-scale/d3-shape, DOMPurify) đều đã được bundle sẵn.

## CDN / không cần build

Làm prototype, CodePen, hay một trang HTML thuần thì cứ load web component thẳng từ CDN, không cần bundler:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [{ date: 2016, value: 10, certainty: true }] },
  ];
</script>
```

> Ghim một major version để chắc ăn, ví dụ `@michi-vz/wc@1`. Bundle CDN chứa **mọi** phần tử, nên với production thì nên cài package và chỉ import những biểu đồ bạn dùng (sub-path theo từng phần tử tree-shake được).

## Styles

Engine tự chèn một `core.css` nhỏ (layout, tooltip, transitions) ngay lần đầu biểu đồ mount, **bạn không cần import CSS nào cả**. Nó cố tình không set **`fill`/`stroke`**: màu sắc là hợp đồng của bạn. Tô màu cho mark bằng nhãn đã sanitize, ngay trong stylesheet của riêng bạn:

```css
.line[data-label-safe="North"] { stroke: #b23a2e; }
.bar[data-label-safe="Africa"] { fill: #cda14a; }
```

Vì biểu đồ render trong **light DOM**, CSS của bạn chạm được vào mọi mark, kể cả pixel canvas, qua một probe `getComputedStyle`.

## Bước tiếp theo

- **[Render biểu đồ đầu tiên của bạn](/vi/guide/getting-started)**: hướng dẫn nhanh theo từng framework.
- **[Duyệt qua các biểu đồ](/vi/charts/)**: 16 ví dụ, mỗi ví dụ một trang.
- **[Tham chiếu API](/vi/api/line)**: props, event, và `getContext()` cho từng biểu đồ.
- **[LLM context](/vi/guide/llm-context)**: `ChartContext` không phụ thuộc renderer mà mỗi biểu đồ phát ra.
