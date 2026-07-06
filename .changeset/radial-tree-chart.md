---
"@michi-vz/core": minor
"@michi-vz/react": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

New chart: **RadialTreeChart** - chart #21, the last new engine of the
sdg-trade migration: a radial cluster()/dendrogram. Migration target for
legacy sdg-trade `TreeRadial` (`Chart.js`).

- d3-hierarchy `cluster()` - NOT `tree()` - verified against the legacy
  chart's exact layout call. `cluster()` places every leaf at the SAME
  radial distance from the centre (a true dendrogram); `tree()` would size
  each branch by its own subtree depth instead.
- `RadialTreeNode` deliberately mirrors `TreemapNode`'s shape
  (label/code/value/color/children) for API consistency across the two
  hierarchical charts. A node's colour group is its TOP-LEVEL ancestor's
  label, exactly like TreemapChart - verified against the legacy chart's
  `groupBy`, which copied the same `colorValueKey` field onto a group AND
  every one of its children. A group's own value is always the sum of its
  children (an explicit `value` on a node with `children` is ignored).
- Dual-level sized circles: a LINEAR scale (verified against the legacy
  chart's own `scaleLinear` - it is NOT a sqrt scale) over the combined
  domain of every group's AND every leaf's own value, applied at every
  depth via `radiusRange` (default `[2, 32]`, the legacy `circleRange`).
- Adaptive label density via `labelDensityThresholds` (`rotateAbove`
  default 20, `hideAbove` default 100 - the legacy `rotateItemThreshold`
  and its unnamed 100-leaf cutoff): full name+value at low density,
  abbreviate-to-3-letters + rotate radially past `rotateAbove`, hide
  entirely past `hideAbove`. A depth-1-only 10-character truncation in the
  medium-density band is preserved as a documented legacy quirk.
- `centerLabel` (legacy `titleCenter`) draws a small centre circle with the
  title word-wrapped to ~10 characters/line - a simplified, deterministic
  port of the legacy pixel-width-aware wrap.
- Links: cubic-bezier dendrogram spokes, control points ported from the
  legacy chart's `projection()` + inline path builder; rendered as one
  background layer (a documented, cosmetic z-order simplification vs. the
  legacy per-node DOM interleaving - a link never visually covers a circle).
- Canvas colour probe: single-element `circle.radial-tree-node-circle
  [data-label-safe]`, keyed by the group. WebGPU DELEGATES to canvas-2D
  (same rationale as ChoroplethMap/SymbolMap: the curved bezier links
  aren't cheaply GPU-tessellable).
- `buildRadialTreeContext`: leaf/group counts, grand total, the largest
  leaf, max nesting depth, NL summary, a11yTable. `checkRadialTreeData`
  flags empty datasets, empty groups (an explicit empty `children` array),
  negative/non-finite values, duplicate labels anywhere in the tree, and
  nesting deeper than the 2-level (group + leaf) contract (new
  `empty-group` / `excess-depth` `DataWarning` types, additive to the
  shared union) - deeper nesting is tolerated, not rejected: every extra
  level still gets a sized circle and a link.
- Full `isLoading`/`isNodata`/`noDataLabel`/`suppressDefaultOverlay`
  chrome quad, `highlightItems`/`disabledItems` (dimming checked by a
  node's own label OR its group label), `skipColorMappingDispatch`,
  `tooltipFormatter`.
- Wrappers: `<michi-vz-radial-tree-chart>` (wc), `RadialTreeChart` (React,
  Vue), `radialTreeChart` action (Svelte), `applyRadialTreeChartProps`
  (Angular).
