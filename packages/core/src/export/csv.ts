// Chart-agnostic CSV export. Every ChartContext carries a full, untruncated
// `a11yTable` ({ headers, rows }) - the same semantic table the a11y mirror renders
// from (the DOM mirror caps at MAX_A11Y_ROWS, but the context copy is complete). So a
// single serializer covers every chart type with no per-chart branching: a consumer
// calls `chartContextToCsv(ref.getContext())` and gets exactly what the chart plots.
import type { ChartContext } from "../types";

export interface CsvOptions {
  /** Field delimiter. Default ",". */
  delimiter?: string;
  /** Row separator. Default "\r\n" (RFC 4180). */
  newline?: string;
  /** Prepend a UTF-8 BOM (U+FEFF) so Excel opens the file as UTF-8. Default false. */
  bom?: boolean;
}

// RFC 4180: quote a field when it contains the delimiter, a double-quote, CR or LF;
// escape interior double-quotes by doubling them.
function escapeField(value: string | number | null | undefined, delimiter: string): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (
    s.includes(delimiter) ||
    s.includes('"') ||
    s.includes("\n") ||
    s.includes("\r")
  ) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Serialize a chart's data to a CSV string from the chart-agnostic `a11yTable` on its
 * ChartContext (obtained via the React handle's `getContext()`, or any wrapper's
 * equivalent). Returns "" when there is no context or table, so a consumer can guard on
 * an empty string. Numbers (including 0) are preserved verbatim.
 */
export function chartContextToCsv(
  ctx: ChartContext | null | undefined,
  opts: CsvOptions = {}
): string {
  const table = ctx?.a11yTable;
  if (!table || !Array.isArray(table.headers)) return "";

  const delimiter = opts.delimiter ?? ",";
  const newline = opts.newline ?? "\r\n";

  const lines: string[] = [];
  lines.push(table.headers.map((h) => escapeField(h, delimiter)).join(delimiter));
  for (const row of table.rows ?? []) {
    lines.push(row.map((cell) => escapeField(cell, delimiter)).join(delimiter));
  }

  const csv = lines.join(newline);
  return opts.bom ? BOM + csv : csv;
}

// UTF-8 byte-order mark; built from a char code so the source stays free of an
// invisible literal character.
const BOM = String.fromCharCode(0xfeff);
