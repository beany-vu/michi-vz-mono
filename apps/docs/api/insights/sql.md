---
title: Aggregate / SQL API
---

# Aggregate / SQL API

Before you can chart data you usually have to *shape* it. `aggregate()` does group-by + measures with
zero dependencies - the model-free default for "roll raw rows into a chart". For real in-browser SQL
over big data, an opt-in DuckDB-Wasm engine is available. For the full story see the
**[Insights guide](/guide/insights#more-from-the-toolbox)**.

Try it - flip the grouping and watch raw rows re-roll into a chart:

<PluginLab feature="sql" />

## Import

```ts
import { aggregate, createSqlEngine } from "@michi-vz/insights/sql";
// also re-exported from the package root: import { aggregate } from "@michi-vz/insights";
```

## `aggregate` - pure group-by

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

| Field | Type | What it does |
| --- | --- | --- |
| `groupBy` | `string \| string[]` | Column(s) to group on. Omit for a single grand-total row. |
| `measures` | `Record<string, { col: string; fn: MeasureFn }>` | Output column -> source column + aggregation. |
| `where` | `(row: Row) => boolean` | Optional row filter applied before grouping. |
| `orderBy` | `{ key: string; dir?: "asc" \| "desc" }` | Optional sort of the output rows. |
| `limit` | `number` | Optional cap on the number of output rows. |

`MeasureFn` = `"sum" \| "avg" \| "min" \| "max" \| "count"`. `Row` = `Record<string, unknown>`. Pure and
deterministic; non-numeric measure values coerce to `0`.

## `createSqlEngine` - opt-in DuckDB-Wasm

For real SQL (joins, window functions) over CSV/Parquet/Arrow at scale, lazy-load a DuckDB-Wasm engine.
It returns `null` when the optional `@duckdb/duckdb-wasm` dep isn't installed, so callers fall back to
`aggregate()`.

```ts
const engine = await createSqlEngine();
if (engine) {
  await engine.registerTable("sales", rows);
  const out = await engine.query("SELECT region, SUM(revenue) FROM sales GROUP BY region");
  await engine.close();
}
```

`SqlEngine` = `{ query(sql): Promise<Row[]>; registerTable(name, rows): Promise<void>; close(): Promise<void> }`.

**[Insights guide](/guide/insights#more-from-the-toolbox)**
