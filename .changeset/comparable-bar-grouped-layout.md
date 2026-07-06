---
"@michi-vz/core": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

New `layout: "overlay" | "grouped"` on ComparableBarChartProps (default `"overlay"`, zero change).

- **`"grouped"` splits each row band into two half-height bars** — `valueBased` on
  the top half, `valueCompared` on the bottom half, same zero/domain origin, no
  overlap — instead of overlaying the two sub-bars at the same y. Geometry branches
  once in the shared render model, so svg/canvas/webgpu stay in lockstep and the
  canvas color-probe DOM contract (`g.bar[data-label-safe] > rect.value-based /
  .value-compared`) is unchanged in both modes. `maxBarHeight` caps the full band;
  the halves are half the capped value. Exposed on the web component (`layout`
  attribute) and `applyComparableHorizontalBarChartProps`.
