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
  canvas color-probe DOM contract is unchanged in both modes: the probe is a
  `<g class="bar" data-label data-label-safe>` ancestor wrapping a
  `<rect class="bar value-based|value-compared" data-label data-label-safe>`
  descendant, so it satisfies real consumer CSS written either as a descendant
  selector (`.bar[data-label-safe="K"] .value-based { fill; stroke }`, thd's
  MonitorV2 TariffStructure/TradeMap contract) or as a same-element/compound
  selector (`.bar { fill }`, `.bar.value-based { fill }`). `maxBarHeight` caps
  the full band; the halves are half the capped value. Exposed on the web
  component (`layout` attribute) and `applyComparableHorizontalBarChartProps`.
