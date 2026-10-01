# @michi-vz/examples

## 1.4.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.31.1

## 1.4.0

### Minor Changes

- `setMichiVzDefaults({ colors, fontFamily, barRadius, tileRadius, tooltip })` sets the look every chart starts from, once per app (the counterpart of `Highcharts.setOptions`); `getMichiVzDefaults` and `resetMichiVzDefaults` read and clear it, and every framework package re-exports all three. A chart prop always wins, then the defaults, then the built-in look. The palette and corner radii are resolved in the data model and the font and tooltip become css variables on the chart host (`--michi-vz-tooltip-radius`, `-shadow`, `-bg`, `-border`, `-color`, `-font-size`), so svg, canvas and webgpu draw the same thing. TreemapChart gains `tileRadius` (default 1; canvas tiles were square before, now they match svg). ComparableHorizontal/VerticalBar on webgpu now round their corners with `barRadius` like svg and canvas (new `pushRoundedRect`).

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.31.0

## 1.3.0

### Minor Changes

- LineChart gains `areaFill` and `lastPointLabel`. `areaFill: true | { topOpacity, bottomOpacity, baseline }` fills the area under each line with a vertical gradient in the series colour (0.5 at the top of the plot fading to 0 at a 0 baseline by default), drawn under every line in svg and canvas; a `renderer="webgpu"` chart draws as canvas while it is on. `lastPointLabel: true | { formatter, color, fontSize }` prints each series' latest visible value above its last point, kept inside the chart width, as SVG text in every renderer (an `svg.mv-overlay-svg` above the canvas in painted modes, so exports keep it). Both are off by default. The WC element and the Angular applicator forward both props; `LineAreaFillConfig` and `LineLastPointLabelConfig` are exported. Dev tooling: the `brace-expansion` overrides move to 1.1.21 / 2.1.7 / 5.0.12 for three new advisories.

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.30.0

## 1.2.0

### Minor Changes

- ac23807: FountainChart is redesigned into a simpler chart that first-time readers can read. Each jet is a stem up to a big dot (the usual value), a bell-shaped fountain spanning the real range from `low` to `high`, and small dots, one per real measurement in `samples`, packed inside the fountain at their exact heights. New data fields `low`, `high`, `samples` and `forecast` (`value` is optional when samples are given: the median is used; `spread` stays as a shorthand). New props `showRange`, `showSamples`, `showValueLabels` (usual value, the two ends and reference counts under each jet), `drift` (the Geneva lean, off by default), `referenceLines` (with "17 of 20 within 45 min" counts), `yAxisTitle`, `endLabels`, `labels`, `sampleWord` and `readingGuide`. One column hit-test drives hover, pinning and Escape in svg, canvas and webgpu; colours stay put when a series is disabled; the context, summary and a11y table report the range, sample count and reference counts. The old look options (`style`, `frothLayers`, `bloomExponent`, `stemFraction`, `showDroplets`, `showMist`, item `density` and `lean`) are ignored with an `ignored-option` warning. New warnings: `range-excludes-value`, `sample-outside-range`, `inverted-range`, `out-of-domain`, `missing-date`. The fountain now supports `isLoading`, `isNodata` and `noDataLabel`. `tooltipFormatter` receives the item with its resolved `value`. Also fixed for every chart: yearly and monthly axis labels no longer read one year or month early west of UTC. The web component and `@michi-vz/angular` forward the new props; the React and Vue fountain hosts default to the engine's 900 x 480. The examples package carries 16 everyday fountain examples and the reading-key patterns.

### Patch Changes

- Updated dependencies [bcde939]
- Updated dependencies [ac23807]
- Updated dependencies [3750732]
  - @michi-vz/core@1.29.0

## 1.1.19

### Patch Changes

- Updated dependencies [c649189]
  - @michi-vz/core@1.28.0

## 1.1.18

### Patch Changes

- Updated dependencies [7915560]
- Updated dependencies
- Updated dependencies [01751c7]
  - @michi-vz/core@1.27.0

## 1.1.17

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.26.0

## 1.1.16

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.25.0

## 1.1.15

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.24.0

## 1.1.14

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.23.0

## 1.1.13

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.22.0

## 1.1.12

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.21.0

## 1.1.11

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.20.1

## 1.1.10

### Patch Changes

- Updated dependencies [62dfd94]
  - @michi-vz/core@1.20.0

## 1.1.9

### Patch Changes

- Updated dependencies [a6af158]
- Updated dependencies [93e5bcf]
  - @michi-vz/core@1.19.1

## 1.1.8

### Patch Changes

- Updated dependencies [e3414ce]
  - @michi-vz/core@1.19.0

## 1.1.7

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.18.0

## 1.1.6

### Patch Changes

- Updated dependencies [d4ca9d9]
  - @michi-vz/core@1.17.0

## 1.1.5

### Patch Changes

- Updated dependencies [4c71e2b]
  - @michi-vz/core@1.16.2

## 1.1.4

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.16.1

## 1.1.3

### Patch Changes

- Updated dependencies [5ccc78c]
  - @michi-vz/core@1.16.0

## 1.1.2

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.15.0

## 1.1.1

### Patch Changes

- Updated dependencies [17abc81]
  - @michi-vz/core@1.14.0

## 1.1.0

### Minor Changes

- 486978e: New chart #22: GaugeChart - a concentric ring gauge (`mountGaugeChart` / `<GaugeChart>` / `<michi-vz-gauge-chart>`). One ring per dataSet item (outer to inner), each sweeping value/max of a full circle clockwise from `startAngle` over a background track; a null value renders the track only. Configurable ring thickness/gap, per-ring arc + track colours and opacities, rounded caps, `defaultActive` resting ring, hover activation with `onHighlightItem`, a built-in centre readout (`showCenterLabel` / `centerContent` / `valueFormatter` / `noValueLabel`), an opt-in `tooltipFormatter`, and svg / canvas / webgpu renderers sharing the standard colour-probe contract. Ships with ChartContext + legendData + a11y mirror, loading/no-data chrome, docs (4 locales), and examples.

### Patch Changes

- Updated dependencies [486978e]
- Updated dependencies [486978e]
  - @michi-vz/core@1.13.0

## 1.0.20

### Patch Changes

- Updated dependencies [3dab6e7]
  - @michi-vz/core@1.12.2

## 1.0.19

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.12.1

## 1.0.18

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.12.0

## 1.0.17

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.11.1

## 1.0.16

### Patch Changes

- Updated dependencies [9c0d6ae]
- Updated dependencies [a6e7db1]
  - @michi-vz/core@1.11.0

## 1.0.15

### Patch Changes

- Updated dependencies [bfd75d7]
- Updated dependencies [04dfb80]
- Updated dependencies [04dfb80]
  - @michi-vz/core@1.10.0

## 1.0.14

### Patch Changes

- Updated dependencies [849fcf0]
- Updated dependencies [2303099]
- Updated dependencies [88d5d8f]
- Updated dependencies [9386db8]
- Updated dependencies [1d1a000]
- Updated dependencies [69f6b96]
- Updated dependencies [d489c39]
  - @michi-vz/core@1.9.0

## 1.0.13

### Patch Changes

- Updated dependencies [e62ad08]
- Updated dependencies [57a9150]
- Updated dependencies [17be1b0]
- Updated dependencies [f109971]
  - @michi-vz/core@1.8.0

## 1.0.12

### Patch Changes

- Updated dependencies [3c0bc4b]
- Updated dependencies [d920094]
- Updated dependencies [d920094]
- Updated dependencies [d920094]
- Updated dependencies [2b68160]
  - @michi-vz/core@1.7.0

## 1.0.11

### Patch Changes

- Updated dependencies [322ea0c]
- Updated dependencies [e063c94]
- Updated dependencies [680b89a]
  - @michi-vz/core@1.6.0

## 1.0.10

### Patch Changes

- Updated dependencies [55e21f9]
  - @michi-vz/core@1.5.6

## 1.0.9

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.5

## 1.0.8

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.4

## 1.0.7

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.3

## 1.0.6

### Patch Changes

- Updated dependencies [18b92b4]
  - @michi-vz/core@1.5.2

## 1.0.5

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.1

## 1.0.4

### Patch Changes

- Updated dependencies [cdf1e8d]
  - @michi-vz/core@1.5.0

## 1.0.3

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.2.1

## 1.0.2

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.1.1

## 1.0.1

### Patch Changes

-
- Updated dependencies
  - @michi-vz/core@1.1.0
