// Cheap change-detection signature for gating onChartDataProcessed.
//
// Engines used to sign the context with a bare JSON.stringify(context). That
// serializes a11yTable.rows (one row per datum) and legendData (one item per
// unique label) on EVERY render: a multi-MB string for a 50k-point scatter,
// and twice at mount on WebGPU-capable browsers (canvas stopgap + GPU upgrade
// re-render). The a11y DOM mirror caps its rendered table at 100 rows, but the
// signature did not, defeating that cap.
//
// This helper keeps the exact change-detection semantics (any change anywhere
// in the context flips the signature) while staying bounded: the two per-datum
// fields are folded through FNV-1a instead of serialized, and only the small
// remainder (chartType, summary, stats, domains, colorsMapping, ...) goes
// through JSON.stringify.
import type { BaseChartContext } from "../types";

const CELL_SEP = "\u001f"; // unit separator
const ROW_SEP = "\u001e"; // record separator

/** Fold a string into a running 32-bit FNV-1a hash. */
function mix(h: number, s: string): number {
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Hash a table of primitive cells with two seeds (64-bit-ish collision odds).
 * Cell/row separators keep ["ab","c"] distinct from ["a","bc"]. */
function hashCells(rows: ReadonlyArray<ReadonlyArray<string | number | boolean>>): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01234567;
  for (const row of rows) {
    for (const cell of row) {
      const s = typeof cell === "string" ? cell : String(cell);
      h1 = mix(h1, s);
      h1 = mix(h1, CELL_SEP);
      h2 = mix(h2, s);
      h2 = mix(h2, CELL_SEP);
    }
    h1 = mix(h1, ROW_SEP);
    h2 = mix(h2, ROW_SEP);
  }
  return h1.toString(36) + "." + h2.toString(36);
}

/** Bounded signature of a chart context; equal iff the context is (all but
 * astronomically) certainly unchanged. Used to fire onChartDataProcessed only
 * once per distinct context. */
export function contextSignature(context: BaseChartContext): string {
  // `series` is per-label on most charts but can be per-datum-sized when labels
  // are unique (a 50k-point scatter), so it is hashed like rows/legend rather
  // than serialized into the signature.
  const { a11yTable, legendData, series, ...rest } = context as BaseChartContext & {
    series?: ReadonlyArray<unknown>;
  };
  const seriesSig = Array.isArray(series)
    ? series.length + ":" + hashCells(series.map((s) => [JSON.stringify(s)]))
    : "none";
  const legendSig = legendData
    ? hashCells(
        legendData.map((l) => [
          l.label,
          l.color,
          l.order,
          l.disabled ?? false,
          l.dataLabelSafe ?? "",
        ]),
      )
    : "none";
  return (
    JSON.stringify(rest) +
    "|h:" +
    JSON.stringify(a11yTable.headers) +
    "|r:" +
    a11yTable.rows.length +
    ":" +
    hashCells(a11yTable.rows) +
    "|l:" +
    (legendData ? legendData.length : -1) +
    ":" +
    legendSig +
    "|s:" +
    seriesSig
  );
}
