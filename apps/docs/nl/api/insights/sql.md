---
title: Aggregate / SQL API
---

# Aggregate / SQL API

Voordat je data kunt visualiseren, moet je die meestal eerst *vormgeven*. `aggregate()` doet group-by +
metingen zonder dependencies - de modelvrije standaard voor "rol ruwe rijen op tot een grafiek". Voor
echte in-browser SQL over grote datasets is een opt-in DuckDB-Wasm-engine beschikbaar. Voor het volledige
verhaal, zie de **[Insights-gids](/nl/guide/insights#more-from-the-toolbox)**.

Probeer het - wissel de groepering om en bekijk hoe ruwe rijen opnieuw oprollen tot een grafiek:

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

| Veld | Type | Wat het doet |
| --- | --- | --- |
| `groupBy` | `string \| string[]` | Kolom(men) om op te groeperen. Weglaten voor één totaalrij. |
| `measures` | `Record<string, { col: string; fn: MeasureFn }>` | Uitvoerkolom -> bronkolom + aggregatie. |
| `where` | `(row: Row) => boolean` | Optioneel rijfilter dat wordt toegepast vóór het groeperen. |
| `orderBy` | `{ key: string; dir?: "asc" \| "desc" }` | Optionele sortering van de uitvoerrijen. |
| `limit` | `number` | Optionele limiet op het aantal uitvoerrijen. |

`MeasureFn` = `"sum" \| "avg" \| "min" \| "max" \| "count"`. `Row` = `Record<string, unknown>`. Puur en
deterministisch; niet-numerieke meetwaarden worden omgezet naar `0`.

## `createSqlEngine` - opt-in DuckDB-Wasm

Voor echte SQL (joins, window-functies) over CSV/Parquet/Arrow op schaal, laad je lazy een
DuckDB-Wasm-engine. Deze retourneert `null` wanneer de optionele `@duckdb/duckdb-wasm`-dependency niet
is geïnstalleerd, zodat aanroepers terugvallen op `aggregate()`.

```ts
const engine = await createSqlEngine();
if (engine) {
  await engine.registerTable("sales", rows);
  const out = await engine.query("SELECT region, SUM(revenue) FROM sales GROUP BY region");
  await engine.close();
}
```

`SqlEngine` = `{ query(sql): Promise<Row[]>; registerTable(name, rows): Promise<void>; close(): Promise<void> }`.

**[Insights-gids](/nl/guide/insights#more-from-the-toolbox)**
