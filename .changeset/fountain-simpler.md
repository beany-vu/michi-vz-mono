---
"@michi-vz/core": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
"@michi-vz/examples": minor
"@michi-vz/react": patch
"@michi-vz/vue": patch
---

FountainChart is redesigned into a simpler chart that first-time readers can read. Each jet is a stem up to a big dot (the usual value), a bell-shaped fountain spanning the real range from `low` to `high`, and small dots, one per real measurement in `samples`, packed inside the fountain at their exact heights. New data fields `low`, `high`, `samples` and `forecast` (`value` is optional when samples are given: the median is used; `spread` stays as a shorthand). New props `showRange`, `showSamples`, `showValueLabels` (usual value, the two ends and reference counts under each jet), `drift` (the Geneva lean, off by default), `referenceLines` (with "17 of 20 within 45 min" counts), `yAxisTitle`, `endLabels`, `labels`, `sampleWord` and `readingGuide`. One column hit-test drives hover, pinning and Escape in svg, canvas and webgpu; colours stay put when a series is disabled; the context, summary and a11y table report the range, sample count and reference counts. The old look options (`style`, `frothLayers`, `bloomExponent`, `stemFraction`, `showDroplets`, `showMist`, item `density` and `lean`) are ignored with an `ignored-option` warning. New warnings: `range-excludes-value`, `sample-outside-range`, `inverted-range`, `out-of-domain`, `missing-date`. The fountain now supports `isLoading`, `isNodata` and `noDataLabel`. `tooltipFormatter` receives the item with its resolved `value`. Also fixed for every chart: yearly and monthly axis labels no longer read one year or month early west of UTC. The web component and `@michi-vz/angular` forward the new props; the React and Vue fountain hosts default to the engine's 900 x 480. The examples package carries 16 everyday fountain examples and the reading-key patterns.
