// Deep diff between two JSON-safe snapshots (ChartContext history entries). Pure and
// dependency-free so the Diff tab and tests can share it.

export interface DiffEntry {
  /**
   * Dotted path with array indices, e.g. "series[0].max". Under the `keyOf` option
   * an item matched by identity shows its key instead: `series["Revenue"].max`.
   */
  path: string;
  /**
   * "reordered" (only under `keyOf`): the array at `path` holds the same members in
   * a new order. `from` / `to` are the old and new orders (the item keys for an
   * array of records, the values themselves for an array of primitives).
   */
  kind: "added" | "removed" | "changed" | "reordered";
  from?: unknown;
  to?: unknown;
}

export interface DiffOptions {
  /**
   * Match array items by identity instead of by position, so a Top-N re-rank or a
   * sort reads as one "reordered" entry plus the real field changes, not a wall of
   * per-index changes. Off by default.
   *
   * - `true`: key each plain-object item by the first of `label`, `key`, `id` or
   *   `code` it carries (string or number), and treat an array of primitives with
   *   the same members in a new order as reordered.
   * - a function: return an item's key, or undefined when it has none.
   *
   * An array is matched by key only when every item on both sides has a key and no
   * key repeats on either side; otherwise it falls back to positions.
   */
  keyOf?: boolean | ((item: unknown) => string | undefined);
}

type KeyFn = (item: unknown) => string | undefined;

const KEY_FIELDS = ["label", "key", "id", "code"] as const;

/** The default identity of an array item: its label, key, id or code. */
export function defaultDiffKey(item: unknown): string | undefined {
  if (!isPlainObject(item)) return undefined;
  for (const field of KEY_FIELDS) {
    const v = item[field];
    if (typeof v === "string" || (typeof v === "number" && Number.isFinite(v))) return String(v);
  }
  return undefined;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPrimitive(v: unknown): boolean {
  return v === null || (typeof v !== "object" && typeof v !== "function");
}

function join(base: string, key: string): string {
  return base ? `${base}.${key}` : key;
}

/** Keys for every item, or null when one is missing or repeats. */
function keysOf(arr: unknown[], keyFn: KeyFn): string[] | null {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    const k = keyFn(item);
    if (k === undefined || seen.has(k)) return null;
    seen.add(k);
    keys.push(k);
  }
  return keys;
}

/** Same members (as a multiset) in a different order. */
function isPrimitiveReorder(prev: unknown[], next: unknown[]): boolean {
  if (prev.length !== next.length || prev.length < 2) return false;
  if (!prev.every(isPrimitive) || !next.every(isPrimitive)) return false;
  if (prev.every((v, i) => v === next[i])) return false;
  const count = new Map<unknown, number>();
  for (const v of prev) count.set(v, (count.get(v) ?? 0) + 1);
  for (const v of next) {
    const c = count.get(v);
    if (!c) return false;
    count.set(v, c - 1);
  }
  return true;
}

function diffKeyed(
  prev: unknown[],
  next: unknown[],
  prevKeys: string[],
  nextKeys: string[],
  basePath: string,
  keyFn: KeyFn,
): DiffEntry[] {
  const out: DiffEntry[] = [];
  const prevByKey = new Map(prevKeys.map((k, i) => [k, prev[i]]));
  const nextSet = new Set(nextKeys);
  // A reorder: the members both sides share appear in a different relative order.
  const sharedPrev = prevKeys.filter((k) => nextSet.has(k));
  const sharedNext = nextKeys.filter((k) => prevByKey.has(k));
  if (sharedPrev.some((k, i) => k !== sharedNext[i])) {
    out.push({ path: basePath, kind: "reordered", from: prevKeys, to: nextKeys });
  }
  const at = (k: string): string => `${basePath}[${JSON.stringify(k)}]`;
  prevKeys.forEach((k, i) => {
    if (!nextSet.has(k)) out.push({ path: at(k), kind: "removed", from: prev[i] });
  });
  nextKeys.forEach((k, i) => {
    if (prevByKey.has(k)) out.push(...walk(prevByKey.get(k), next[i], at(k), keyFn));
    else out.push({ path: at(k), kind: "added", to: next[i] });
  });
  return out;
}

function walk(prev: unknown, next: unknown, basePath: string, keyFn: KeyFn | null): DiffEntry[] {
  if (prev === next) return [];

  if (Array.isArray(prev) && Array.isArray(next)) {
    if (keyFn) {
      if (isPrimitiveReorder(prev, next)) {
        return [{ path: basePath, kind: "reordered", from: prev, to: next }];
      }
      const prevKeys = keysOf(prev, keyFn);
      const nextKeys = prevKeys ? keysOf(next, keyFn) : null;
      if (prevKeys && nextKeys) {
        return diffKeyed(prev, next, prevKeys, nextKeys, basePath, keyFn);
      }
    }
    const out: DiffEntry[] = [];
    const len = Math.max(prev.length, next.length);
    for (let i = 0; i < len; i++) {
      const path = `${basePath}[${i}]`;
      if (i >= prev.length) out.push({ path, kind: "added", to: next[i] });
      else if (i >= next.length) out.push({ path, kind: "removed", from: prev[i] });
      else out.push(...walk(prev[i], next[i], path, keyFn));
    }
    return out;
  }

  if (isPlainObject(prev) && isPlainObject(next)) {
    const out: DiffEntry[] = [];
    for (const key of Object.keys(prev)) {
      const path = join(basePath, key);
      if (!(key in next)) out.push({ path, kind: "removed", from: prev[key] });
      else out.push(...walk(prev[key], next[key], path, keyFn));
    }
    for (const key of Object.keys(next)) {
      if (!(key in prev)) out.push({ path: join(basePath, key), kind: "added", to: next[key] });
    }
    return out;
  }

  // primitives, or a type change (object vs array vs primitive): one changed entry
  return [{ path: basePath, kind: "changed", from: prev, to: next }];
}

/**
 * Every difference between two JSON-safe values as a flat list of added / removed /
 * changed (and, under `options.keyOf`, reordered) entries with dotted paths.
 * `basePath` prefixes every path (e.g. "props").
 */
export function diffObjects(
  prev: unknown,
  next: unknown,
  basePath = "",
  options: DiffOptions = {},
): DiffEntry[] {
  const keyFn: KeyFn | null =
    typeof options.keyOf === "function" ? options.keyOf : options.keyOf ? defaultDiffKey : null;
  return walk(prev, next, basePath, keyFn);
}
