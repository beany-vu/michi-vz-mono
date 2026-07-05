---
"@michi-vz/core": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

New `stackOffset: "none" | "expand"` on AreaChartProps (default `"none"`, zero change).

- **`"expand"` turns AreaChart into a true 100%-stacked chart.** It reuses d3-shape's
  own `stackOffsetExpand` on the existing `d3.stack()` call in `processAreaChartData`,
  so every x-slice's band heights are normalized to sum to 1 - the same divide-by-zero
  guard d3 ships with means an all-zero/null slice renders as an empty (zero-height)
  band instead of `NaN`. The y domain becomes `[0,1]` (this wins over an explicit
  `yAxisDomain` or `forcePercentageScale`, since those don't make sense once the values
  themselves are fractions), and y-axis ticks default to percentage formatting unless
  an explicit `yAxisFormat` is passed. Because the branch lives in the shared
  data/scale layer, all three renderers (svg/canvas/webgpu) and the context builder
  pick it up for free with no renderer-specific code.
- This is distinct from the existing `forcePercentageScale`, which only clamps the
  y-axis *display* range to `[0,100]` without touching the underlying stacked values;
  that prop's behavior is unchanged.
- Exposed on the web component (`stack-offset` attribute) and `applyAreaChartProps`;
  Vue/Svelte/React need no changes (whole-props pass-through).
