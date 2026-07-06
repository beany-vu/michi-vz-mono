---
"@michi-vz/core": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

New `deltaIndicator?: DeltaIndicatorConfig` on ComparableBarChartProps.

- Per row, renders an arrow glyph + formatted difference label
  (`valueCompared - valueBased`) after the end of the bars: green when the sign
  matches `positiveIsGood` (default true), red otherwise, neutral gray + flat
  glyph for zero. `positiveIsUp` flips the arrow direction; `formatter`
  overrides the label. Works in both `overlay` and `grouped` layouts; absent
  prop or `show: false` is a byte-for-byte no-op. NOTE for legacy sdg-trade
  migrations: the old `positiveChangeGood` prop had the inverse visual effect —
  pass its logical negation as `positiveIsGood` to reproduce the legacy look.
  The shared `DeltaIndicatorConfig` type is exported for the upcoming
  ComparableVerticalBarChart, which mirrors this behavior.
