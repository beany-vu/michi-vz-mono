---
"@michi-vz/core": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

Legacy-parity fixes for Ribbon and Comparable, a new BarBell axis option, and legendData on five more contexts.

- **RibbonChart re-ranks each column** (legacy parity): every date's stack is
  sorted ascending by that date's value, so a key's vertical position tracks its
  rank and the connecting ribbons visibly cross when ranks swap. Previously the
  port stacked in fixed key order and ranks could never trade places.
- **ComparableHorizontalBar draws the shorter sub-bar on top** (legacy parity):
  when a row grew, the pale "before" bar was fully hidden behind the longer
  "after" bar. The longer sub-bar now paints first in all three renderers
  (SVG, canvas, WebGPU), so both values always stay visible.
- **ComparableHorizontalBar regains `colorsBasedMapping`** (legacy parity): a
  per-label colour for the value-based sub-bar only. Pair an opaque light tint
  with `valueBasedOpacity: 1` for a crisp before/after contrast that no longer
  depends on translucent overlap. Exposed on the web component and
  `applyComparableHorizontalBarChartProps`.
- **RadarChart keeps pole labels out of the title band**: when a title renders,
  upward-overshooting axis labels (the straight-up pole especially) are clamped
  below it instead of colliding.
- **New `layoutMode: "sync" | "async"` and `settleTicks` on BubbleChartProps**:
  async runs the SAME deterministic force settle in ~12ms slices behind the
  chart's loading overlay, so thousand-bubble clusters no longer freeze the page
  (a 3k-bubble settle blocked the main thread for ~20s). The settled layout is
  also memoised on its inputs, so re-renders with unchanged data (highlights,
  the WebGPU upgrade pass) skip the simulation entirely, and a zero-strength
  charge no longer pays the Barnes-Hut quadtree. Exposed on the web component
  (`layout-mode`, `settle-ticks`) and `applyBubbleChartProps`.
- **New `xAxisDomain: [min, max]` on GapChartProps**: fixes the value axis instead
  of the derived zero-baseline domain (zoom a life-expectancy story into its
  35-90 band). An explicit domain skips d3 nice() re-rounding. Exposed on the web
  component and `applyGapChartProps`.
- **New `xAxisPosition: "top" | "bottom"` on BarBellChartProps** (default "top",
  the legacy header look): "bottom" moves the value-axis tick labels below the
  plot, clearing room under the title. Exposed on the web component
  (`x-axis-position`) and `applyBarBellChartProps`.
- **`legendData` now also on Ribbon, Range, Fan, Fountain (snapshot), Pie,
  Treemap, and Bubble contexts**, mirroring the resolved series colours, so
  consumer colour authorities and generic legends can key off every chart's
  context. Treemap and Bubble rows additionally carry the new
  **`LegendItem.paleColor`**: the opaque white-mix of the split's veiled
  remainder (computed with the same veil strength the renderers paint), so a
  paired pale/solid legend can match the pixels exactly.
