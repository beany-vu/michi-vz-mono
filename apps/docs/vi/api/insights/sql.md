---
title: Aggregate / SQL API
---

# Aggregate / SQL API

Trước khi có thể vẽ biểu đồ dữ liệu, bạn thường phải *định hình* nó trước. `aggregate()` thực hiện
group-by + các phép đo (measures) mà không cần phụ thuộc nào - lựa chọn mặc định không cần mô hình cho
việc "cuộn các hàng dữ liệu thô thành một biểu đồ". Với SQL thực sự chạy ngay trên trình duyệt cho dữ
liệu lớn, một engine DuckDB-Wasm tùy chọn cũng có sẵn. Xem toàn bộ câu chuyện tại
**[Hướng dẫn Insights](/vi/guide/insights#more-from-the-toolbox)**.

Thử ngay - đổi cách nhóm và xem các hàng thô cuộn lại thành một biểu đồ:

<PluginLab feature="sql" />

## Import

```ts
import { aggregate, createSqlEngine } from "@michi-vz/insights/sql";
// also re-exported from the package root: import { aggregate } from "@michi-vz/insights";
```

## `aggregate` - group-by thuần túy

```ts
const rows = [
  { region: "North", revenue: 42, target: 38 },
  { region: "North", revenue: 28, target: 30 },
  { region: "South", revenue: 19, target: 22 },
];

aggregate(rows, {
  groupBy: "region",
  measures: { revenue: { col: "revenue", fn: "sum" }, target: { col: "target", fn: "sum" } },
  orderBy: { key: "revenue", dir: "desc" },
});
// → [{ region: "North", revenue: 70, target: 68 }, { region: "South", revenue: 19, target: 22 }]
```

| Trường | Kiểu | Chức năng |
| --- | --- | --- |
| `groupBy` | `string \| string[]` | (Các) cột dùng để nhóm. Bỏ trống để có một hàng tổng cộng duy nhất. |
| `measures` | `Record<string, { col: string; fn: MeasureFn }>` | Cột đầu ra -> cột nguồn + phép tổng hợp. |
| `where` | `(row: Row) => boolean` | Bộ lọc hàng tùy chọn, áp dụng trước khi nhóm. |
| `orderBy` | `{ key: string; dir?: "asc" \| "desc" }` | Sắp xếp tùy chọn cho các hàng đầu ra. |
| `limit` | `number` | Giới hạn tùy chọn cho số lượng hàng đầu ra. |

`MeasureFn` = `"sum" \| "avg" \| "min" \| "max" \| "count"`. `Row` = `Record<string, unknown>`. Thuần
túy và tất định; các giá trị measure không phải số sẽ được ép về `0`.

## `createSqlEngine` - DuckDB-Wasm tùy chọn

Để có SQL thực sự (join, hàm cửa sổ) trên CSV/Parquet/Arrow ở quy mô lớn, hãy lazy-load một engine
DuckDB-Wasm. Nó trả về `null` khi dependency tùy chọn `@duckdb/duckdb-wasm` chưa được cài đặt, để bên
gọi quay về dùng `aggregate()`.

```ts
const engine = await createSqlEngine();
if (engine) {
  await engine.registerTable("sales", rows);
  const out = await engine.query("SELECT region, SUM(revenue) FROM sales GROUP BY region");
  await engine.close();
}
```

`SqlEngine` = `{ query(sql): Promise<Row[]>; registerTable(name, rows): Promise<void>; close(): Promise<void> }`.

**[Hướng dẫn Insights](/vi/guide/insights#more-from-the-toolbox)**
