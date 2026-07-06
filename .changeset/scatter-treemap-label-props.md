---
"@michi-vz/core": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

Closes consumer-parity gaps found migrating sdg-trade's Scatterplot and TreemapChart, all additive and default-off (or default-zero-diff for the enum prop).

- **ScatterChart**: `pointLabels?: boolean | { formatter? }` renders a per-point text label, painted on the SVG scaffold layer (same treatment as `deltaIndicator`) so it looks identical across `svg`/`canvas`/`webgpu`. Placement is a simplified right-of-point + overlap-hide strategy (bounding-box collision, deterministic given draw order) - intentionally NOT the legacy's d3-voronoi cell-picking (no new dependency added).
- **ScatterChart**: `drawOrder?: "sizeDescending" | "sizeAscending"` controls bubble z-order. `"sizeDescending"` (default, zero-diff) is this chart's existing "largest bubble behind, smallest on top" ordering. `"sizeAscending"` is a genuine opt-in that flips the sort so the LARGEST bubble draws last/on top instead, reproducing the actual legacy sdg-trade z-order - confirmed by re-reading `Scatterplot.js` (ascending sort by raw size value) + `Chart.js` (draws in that array order; later SVG siblings paint over earlier ones), which shows legacy's real z-order is "large on top," not "small on top" as first assumed. This genuinely closes the drawOrder parity gap via the `sizeAscending` mode.
- **TreemapChart**: `tileValueLabels?: boolean | { formatter? }` renders `"{value} ({pct}%)"` as a second line under the existing tile name, reusing the SAME tile-size gate the split "percent of leaf" second line already uses (`w >= 48 && h >= 34`, on top of the existing name gate `h >= 24 && w >= 30`) rather than inventing a new threshold. `fractionOfTotal` is the leaf's share of the grand total across every leaf (matching `buildTreemapContext`'s `grandTotal`).

`pointLabels`/`tileValueLabels` absent or `false`, and `drawOrder` absent, are byte-for-byte no-ops (proven by DOM-identity tests). Wired through the WC elements (object props as `{attribute: false}`) and the Angular applicators; `@michi-vz/react`/`vue`/`svelte` need no changes since they pass props through wholesale.
