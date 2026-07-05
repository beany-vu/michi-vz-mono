---
title: API Aggregate / SQL
---

# API Aggregate / SQL

Avant de pouvoir tracer des données, il faut généralement les *mettre en forme*. `aggregate()` fait du
group-by + des mesures sans aucune dépendance - le défaut sans modèle pour "transformer des lignes brutes
en graphique". Pour du vrai SQL dans le navigateur sur de grosses données, un moteur DuckDB-Wasm optionnel
est disponible. Pour l'histoire complète, voir le
**[guide Insights](/fr/guide/insights#more-from-the-toolbox)**.

Essayez-le - basculez le regroupement et regardez les lignes brutes se retransformer en graphique :

<PluginLab feature="sql" />

## Import

```ts
import { aggregate, createSqlEngine } from "@michi-vz/insights/sql";
// also re-exported from the package root: import { aggregate } from "@michi-vz/insights";
```

## `aggregate` - group-by pur

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

| Champ | Type | Ce que ça fait |
| --- | --- | --- |
| `groupBy` | `string \| string[]` | Colonne(s) sur lesquelles regrouper. Omettez pour une seule ligne de grand total. |
| `measures` | `Record<string, { col: string; fn: MeasureFn }>` | Colonne de sortie -> colonne source + agrégation. |
| `where` | `(row: Row) => boolean` | Filtre de ligne optionnel appliqué avant le regroupement. |
| `orderBy` | `{ key: string; dir?: "asc" \| "desc" }` | Tri optionnel des lignes de sortie. |
| `limit` | `number` | Plafond optionnel sur le nombre de lignes de sortie. |

`MeasureFn` = `"sum" \| "avg" \| "min" \| "max" \| "count"`. `Row` = `Record<string, unknown>`. Pur et
déterministe ; les valeurs de mesure non numériques sont converties en `0`.

## `createSqlEngine` - DuckDB-Wasm optionnel

Pour du vrai SQL (jointures, fonctions de fenêtrage) sur des CSV/Parquet/Arrow à grande échelle, chargez
en différé un moteur DuckDB-Wasm. Il retourne `null` quand la dépendance optionnelle `@duckdb/duckdb-wasm`
n'est pas installée, afin que les appelants reviennent à `aggregate()`.

```ts
const engine = await createSqlEngine();
if (engine) {
  await engine.registerTable("sales", rows);
  const out = await engine.query("SELECT region, SUM(revenue) FROM sales GROUP BY region");
  await engine.close();
}
```

`SqlEngine` = `{ query(sql): Promise<Row[]>; registerTable(name, rows): Promise<void>; close(): Promise<void> }`.

**[guide Insights](/fr/guide/insights#more-from-the-toolbox)**
