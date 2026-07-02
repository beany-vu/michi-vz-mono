// Deep diff between two JSON-safe snapshots (ChartContext history entries). Pure and
// dependency-free so the Diff tab and tests can share it.

export interface DiffEntry {
  /** Dotted path with array indices, e.g. "series[0].max". */
  path: string;
  kind: "added" | "removed" | "changed";
  from?: unknown;
  to?: unknown;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function join(base: string, key: string): string {
  return base ? `${base}.${key}` : key;
}

export function diffObjects(prev: unknown, next: unknown, basePath = ""): DiffEntry[] {
  if (prev === next) return [];

  if (Array.isArray(prev) && Array.isArray(next)) {
    const out: DiffEntry[] = [];
    const len = Math.max(prev.length, next.length);
    for (let i = 0; i < len; i++) {
      const path = `${basePath}[${i}]`;
      if (i >= prev.length) out.push({ path, kind: "added", to: next[i] });
      else if (i >= next.length) out.push({ path, kind: "removed", from: prev[i] });
      else out.push(...diffObjects(prev[i], next[i], path));
    }
    return out;
  }

  if (isPlainObject(prev) && isPlainObject(next)) {
    const out: DiffEntry[] = [];
    for (const key of Object.keys(prev)) {
      const path = join(basePath, key);
      if (!(key in next)) out.push({ path, kind: "removed", from: prev[key] });
      else out.push(...diffObjects(prev[key], next[key], path));
    }
    for (const key of Object.keys(next)) {
      if (!(key in prev)) out.push({ path: join(basePath, key), kind: "added", to: next[key] });
    }
    return out;
  }

  // primitives, or a type change (object vs array vs primitive): one changed entry
  return [{ path: basePath, kind: "changed", from: prev, to: next }];
}
