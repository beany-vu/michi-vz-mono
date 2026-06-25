// Moved verbatim from michi-vz src/components/hooks/lineChart/lineChartUtils.ts.
// SINGLE SOURCE OF TRUTH for the data-label-safe transform. Every renderer (SVG,
// canvas, a11y mirror) and every consumer that injects per-label CSS MUST use
// this exact function — re-deriving it with a different transform (e.g. "-"
// instead of "_") silently breaks the canvas colour probe (see resolveMarkColors).
export function sanitizeForClassName(str: string): string {
  return str.replace(/[^a-z0-9]/gi, "_");
}
