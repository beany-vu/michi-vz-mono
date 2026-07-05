---
"@michi-vz/core": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

New `yAxisScale: "linear" | "log"` on LineChartProps (default `"linear"`, zero change).

- **`"log"` draws a base-10 logarithmic y-axis** across all three renderers (svg,
  canvas, webgpu), since they share one scale factory. Non-positive values (`<= 0`)
  can't exist on a log scale, so they're treated as missing points: dropped from
  their series (like any other gap - the drop happens before `detectGaps`, so an
  opted-in gap check still dashes the resulting hole), and the y domain is derived
  from the remaining positive values only. A dropped point fires `onDataWarning`
  with a `"non-positive-log-value"` warning naming the series and count. A dataSet
  with no positive values anywhere renders the no-data state instead of crashing.
  Y ticks use d3's default log ticks, still formatted through `yAxisFormat` if
  provided. Exposed on the web component (`y-axis-scale`) and
  `applyLineChartProps`; Vue/Svelte/React need no changes (whole-props pass-through).
