---
title: API Cây tỏa tròn
---

# API Cây tỏa tròn

Một sơ đồ cụm/dendrogram tỏa tròn: các nhóm tỏa ra từ một điểm trung tâm, lá nằm ở CÙNG bán kính như mọi lá khác - xem **[demo Cây tỏa tròn](/vi/charts/radial-tree)**.

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/radial-tree-chart";
// <michi-vz-radial-tree-chart> giờ đã được định nghĩa
```

```ts [Vanilla JS]
import { mountRadialTreeChart } from "@michi-vz/core";

const chart = mountRadialTreeChart(el, props);
```

:::

## Props

<PropsTable chart="radial-tree-chart" />

## Sự kiện

Web component phát ra các `CustomEvent` nổi bọt (bubbling) sau (engine cũng cung cấp tương tự qua các callback `on*` trong bảng trên):

| Sự kiện | Chi tiết | Xảy ra khi |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | phần được tô sáng khi di chuột thay đổi |
| `michi-vz:colormapping` | `Record<string, string>` | một ánh xạ màu được tạo ra |
| `michi-vz:dataprocessed` | `ChartContext` | dữ liệu được xử lý (lại) |
| `michi-vz:datawarning` | `DataWarning[]` | phát hiện cảnh báo dữ liệu đầu vào (nhóm rỗng, giá trị âm/không hữu hạn, nhãn trùng lặp, lồng sâu hơn 2 cấp) |

## getContext()

`mountRadialTreeChart(el, props).getContext()` trả về **`RadialTreeChartContext`** không phụ thuộc renderer: `stats.leafCount` / `groupCount` / `grandTotal` / `largest` (lá lớn nhất) / `maxDepth`, một mảng `nodes[]` (một dòng cho mỗi nút - nhóm hoặc lá - với `label`, `code`, `color`, `depth`, `isLeaf`, `value`, `path`), một `summary` tất định bằng ngôn ngữ tự nhiên, và một `a11yTable`. Xem [Ngữ cảnh LLM](/vi/guide/llm-context).

## Nguồn

Props được định kiểu là [`RadialTreeChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) trong `@michi-vz/core`.
