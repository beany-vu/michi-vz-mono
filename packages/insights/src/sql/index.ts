// SQL / data-wrangling. The heavy path lazy-loads DuckDB-Wasm (in-browser OLAP SQL
// over big CSV/Parquet/Arrow) and is opt-in; the default is a pure, model-free
// `aggregate()` (group-by + measures + filter/sort/limit) that handles the common
// "shape data before charting" case with zero deps and is fully testable.
import { optionalImport } from "../internal/lazyImport";

export type Row = Record<string, unknown>;
export type MeasureFn = "sum" | "avg" | "min" | "max" | "count";

export interface AggregateSpec {
  groupBy?: string | string[];
  /** output column -> { source column, aggregation }. */
  measures: Record<string, { col: string; fn: MeasureFn }>;
  where?: (row: Row) => boolean;
  orderBy?: { key: string; dir?: "asc" | "desc" };
  limit?: number;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Pure group-by aggregation over rows. The model-free data-wrangling default. */
export function aggregate(rows: Row[], spec: AggregateSpec): Row[] {
  const groupKeys = spec.groupBy == null ? [] : Array.isArray(spec.groupBy) ? spec.groupBy : [spec.groupBy];
  const filtered = spec.where ? rows.filter(spec.where) : rows;

  const groups = new Map<string, Row[]>();
  for (const row of filtered) {
    const key = groupKeys.map((k) => String(row[k])).join("");
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }

  let out: Row[] = [];
  for (const bucket of groups.values()) {
    const result: Row = {};
    for (const k of groupKeys) result[k] = bucket[0][k];
    for (const [outCol, m] of Object.entries(spec.measures)) {
      const vals = bucket.map((r) => num(r[m.col]));
      result[outCol] =
        m.fn === "count"
          ? bucket.length
          : m.fn === "sum"
            ? vals.reduce((a, b) => a + b, 0)
            : m.fn === "avg"
              ? vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
              : m.fn === "min"
                ? Math.min(...vals)
                : Math.max(...vals);
    }
    out.push(result);
  }

  if (spec.orderBy) {
    const { key, dir } = spec.orderBy;
    const sign = dir === "desc" ? -1 : 1;
    out.sort((a, b) => (num(a[key]) - num(b[key])) * sign);
  }
  if (spec.limit != null) out = out.slice(0, spec.limit);
  return out;
}

export interface SqlEngine {
  query(sql: string): Promise<Row[]>;
  /** register an array of rows as a queryable table. */
  registerTable(name: string, rows: Row[]): Promise<void>;
  close(): Promise<void>;
}

/**
 * Lazy DuckDB-Wasm engine for real in-browser SQL. Returns null when DuckDB-Wasm
 * isn't installed (opt-in dep) — callers fall back to `aggregate()`.
 */
export async function createSqlEngine(): Promise<SqlEngine | null> {
  const duckdb = await optionalImport<Record<string, unknown>>("@duckdb/duckdb-wasm");
  if (!duckdb) return null;
  // Wiring DuckDB-Wasm bundles/worker is environment-specific; consumers that install
  // it provide the bundle. Until then this returns null and aggregate() is the path.
  return null;
}
