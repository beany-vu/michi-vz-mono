---
"@michi-vz/core": minor
"@michi-vz/wc": minor
---

RadarChart `niceMaxValue` rounds the outer ring up to a round number when `maxValue` is not set: the last "nice" tick of [0, data max] (`true` uses `rings` as the tick count, a number sets it), so the outer ring label reads 80 rather than 73. Also exported as the pure `niceRadarMax(dataMax, tickCount)`. New `sequentialScheme(name, count)` returns ColorBrewer's single-hue sequential palettes (blues, greens, greys, oranges, purples, reds; 3 to 9 colours, clamped) for a choropleth `colorScale.range` without a d3 dependency, with `SEQUENTIAL_SCHEME_NAMES` and the `SequentialSchemeName` type. The web component takes `niceMaxValue` as a property and `@michi-vz/angular` forwards it.
