---
"@michi-vz/core": minor
"@michi-vz/react": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

New chart: **ComparableVerticalBarChart** - per-category comparison columns, the
vertical sibling of ComparableHorizontalBarChart and the direct migration target
for legacy sdg-trade `BarchartVertical`.

- Band x (categories) + linear y (values, diverging from 0). Each category draws
  TWO FULL-BANDWIDTH overlapping columns at the SAME x: `valueBased` (the rear/
  reference value, hatch-eligible via `patternsMapping`) and `valueCompared` (the
  front/current value, solid). Unlike ComparableHorizontalBarChart's optional
  `layout: "grouped"`, this chart is overlay-only. The z-order is **FIXED** (not
  width-dependent like the horizontal chart): `valueBased` is always painted
  behind, `valueCompared` always in front - ported from legacy sdg-trade
  `BarchartVertical/Chart.js`'s `BarCompare`/`Bar` paint order.
- Reuses `ComparableBarDataPoint` and `DeltaIndicatorConfig` verbatim.
  `deltaIndicator: { show: true }` draws a change arrow + formatted label ABOVE
  the taller of the two sub-bars (legacy `translate(bandwidth/3, -32)`
  placement). **Unlike the horizontal chart, this chart's `getContext()`
  reflects the indicator**: `series[].deltaDirection` / `deltaColor` /
  `deltaLabel`, `stats.grew` / `shrank` / `unchanged` / `improved` / `worsened`,
  and a fifth a11y "Change" column when active.
- Real `<defs><pattern>` SVG hatch/image fill for `patternsMapping` (new
  `render/svg/patternDefs.ts`, shared), also **backported** into
  ComparableHorizontalBarChart's SVG renderer - its SVG path previously ignored
  `patternsMapping` despite the prop's doc-comment promising it (canvas mode
  already honoured it).
- Category axis reuses VerticalStackBarChart's `chooseAxisMode` layout (fits
  labels horizontally, else rotates -45°, else thins) via `xAxisLabelPadding` /
  `xAxisMode`. `maxBarWidth` caps each column's thickness (centred plot), mirroring
  the horizontal chart's `maxBarHeight`.
- svg/canvas/webgpu renderers, full `isLoading`/`isNodata`/`noDataLabel`/
  `suppressDefaultOverlay` chrome quad, dual-form canvas colour probe (reuses
  `makeSubBarProbe` verbatim - same descendant CSS contract as the horizontal
  chart), dedicated `validate/comparableVerticalBarWarnings.ts`.
- Wrappers: `<michi-vz-comparable-vertical-bar-chart>` (wc), `ComparableVerticalBarChart`
  (React, Vue), `comparableVerticalBarChart` action (Svelte),
  `applyComparableVerticalBarChartProps` (Angular).
