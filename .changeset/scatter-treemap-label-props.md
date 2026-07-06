---
"@michi-vz/core": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

Closes two consumer-parity gaps found migrating sdg-trade's Scatterplot and TreemapChart, both strictly additive and default-off.

- **ScatterChart**: `pointLabels?: boolean | { formatter? }` renders a per-point text label, painted on the SVG scaffold layer (same treatment as `deltaIndicator`) so it looks identical across `svg`/`canvas`/`webgpu`. Placement is a simplified right-of-point + overlap-hide strategy (bounding-box collision, deterministic given draw order) - intentionally NOT the legacy's d3-voronoi cell-picking (no new dependency added).
- **ScatterChart**: `drawOrder?: "none" | "sizeDescending"` names the chart's existing "largest bubble behind, smallest on top" z-order explicitly. Re-reading the actual legacy sdg-trade source shows its real rendered z-order is the OPPOSITE (largest bubble paints last/on top there) - this prop intentionally preserves this library's own pre-existing convention instead, so it is a provable no-op relative to today's default. See the `drawOrder` JSDoc for the full caveat.
- **TreemapChart**: `tileValueLabels?: boolean | { formatter? }` renders `"{value} ({pct}%)"` as a second line under the existing tile name, reusing the SAME tile-size gate the split "percent of leaf" second line already uses (`w >= 48 && h >= 34`, on top of the existing name gate `h >= 24 && w >= 30`) rather than inventing a new threshold. `fractionOfTotal` is the leaf's share of the grand total across every leaf (matching `buildTreemapContext`'s `grandTotal`).

Absent, or `false`, is a byte-for-byte no-op for all three props (proven by DOM-identity tests). Wired through the WC elements (object props as `{attribute: false}`) and the Angular applicators; `@michi-vz/react`/`vue`/`svelte` need no changes since they pass props through wholesale.
