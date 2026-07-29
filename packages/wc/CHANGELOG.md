# @michi-vz/wc

## 1.12.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.15.0

## 1.12.0

### Minor Changes

- 17abc81: VerticalStackBarChart: additive `layout: "horizontal"` - rows on a band y-axis (shared ellipsizing HTML labels) with stacked segments growing rightward from x(0). Same data, colour-slot, legend, tooltip, hit-test, and missing-marker contracts as the vertical layout; `xAxis*` props keep formatting the category axis and `yAxis*`/`yTicks` the value axis in both orientations. Series-abbreviation labels, `xAxisMode`, and `timeline` remain vertical-only.

### Patch Changes

- Updated dependencies [17abc81]
  - @michi-vz/core@1.14.0

## 1.11.0

### Minor Changes

- 486978e: New chart #22: GaugeChart - a concentric ring gauge (`mountGaugeChart` / `<GaugeChart>` / `<michi-vz-gauge-chart>`). One ring per dataSet item (outer to inner), each sweeping value/max of a full circle clockwise from `startAngle` over a background track; a null value renders the track only. Configurable ring thickness/gap, per-ring arc + track colours and opacities, rounded caps, `defaultActive` resting ring, hover activation with `onHighlightItem`, a built-in centre readout (`showCenterLabel` / `centerContent` / `valueFormatter` / `noValueLabel`), an opt-in `tooltipFormatter`, and svg / canvas / webgpu renderers sharing the standard colour-probe contract. Ships with ChartContext + legendData + a11y mirror, loading/no-data chrome, docs (4 locales), and examples.
- 486978e: Export: `chartToPngDataUrl` gains `title` / `caption` text blocks (word-wrapped, alignment/size/colour configurable via `PngTextBlock`) composited above/below the chart, plus `textFontFamily`.

  LineChart: opt-in x-axis drag-to-zoom. New `zoom` prop (`boolean | LineZoomConfig` with `minRange`, `resetButton`, `resetLabel`), `onZoomChange` callback (WC event `michi-vz:zoomchange`), and `resetZoom()` / `setZoomDomain()` instance + React handle methods. Dragging a horizontal range inside the plot zooms the x-domain: marks clip to the plot box (SVG clipPath wrapper / canvas ctx.clip), axis ticks, crosshair snapping, and tooltips follow the zoomed domain, and a built-in "Reset zoom" chip restores the full view. The y-domain intentionally stays full. The webgpu renderer falls back to canvas while zoomed (no clip support there).

### Patch Changes

- Updated dependencies [486978e]
- Updated dependencies [486978e]
  - @michi-vz/core@1.13.0

## 1.10.4

### Patch Changes

- Updated dependencies [3dab6e7]
  - @michi-vz/core@1.12.2

## 1.10.3

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.12.1

## 1.10.2

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.12.0

## 1.10.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.11.1

## 1.10.0

### Minor Changes

- a6e7db1: Play-through-years `timeline` on all 21 charts, reveal animation on every chart, and an animation-resume fix.

  - New opt-in `timeline` prop (off by default) with a built-in play button + year scrubber and a headless controller (`chart.timeline()`, wc `getTimeline()`, React handle `timeline()`). Semantics per chart family: time-axis charts (Line, Area, Range, Fan, VerticalStackBar, Ribbon, Fountain trend mode) draw their marks up to the active year and sweep between years; snapshot charts (Gap, Scatter, Pie, Bubble, both Comparable bars, Dual, ChoroplethMap, SymbolMap) show one period's rows at a time with values tweening between periods; Treemap and RadialTree snapshot via `date`-tagged root nodes with the whole hierarchy tweening; Sankey via `date`-tagged links; Radar and BarBell via a new `period` row field (their `date` already means something else). LineChart's timeline supports `tipLabel` riding the growing line.
  - New opt-in `progressiveDraw` prop: LineChart draws itself left to right with optional tip labels following each line's end; the other charts get a clip-based reveal wipe. `replay()` re-runs it (core instance, wc element, React handle). `timeline` wins when both are set.
  - Both features work in `svg` and `canvas` render modes, respect `prefers-reduced-motion` (instant, no animation), never alter `getContext()`/a11y output, and are inert on the experimental `webgpu` renderer (full frame paints instantly).
  - Fix: a re-render during a running animation now resumes it from its current position instead of jumping to the end. Framework wrappers call `update()` immediately after mount, which previously cancelled every mount autoplay.
  - New `date?` fields on TreemapNode, RadialTreeNode, SankeyLinkItem and `period?` on RadarDataItem, BarBellDataRow; `MountOptions` gains optional `ticker`/`motion` injection for deterministic animation tests. No API removed or renamed.

### Patch Changes

- 9c0d6ae: wc: point the CDN default entry (jsdelivr/unpkg) at the self-contained browser bundle so the bare package URL works in a module script. core: clean up public prop JSDoc (stale fountain defaults, internal porting notes, clearer joinBy/positionMode/crosshair wording).
- Updated dependencies [9c0d6ae]
- Updated dependencies [a6e7db1]
  - @michi-vz/core@1.11.0

## 1.9.1

### Patch Changes

- 04dfb80: GapChart: added `showZeroLineForXAxis` and `maxBarHeight`, at parity with
  ComparableHorizontalBarChart's existing props of the same name/behaviour.
  `showZeroLineForXAxis` draws a solid (non-dashed) vertical line at x=0.
  `maxBarHeight` caps each row's thickness so a 1-2 row chart doesn't stretch
  its band across the full plot height (the band range shrinks to the capped
  thickness and centres in the plot); no-op for dense charts.

  ComparableHorizontalBarChart and GapChart's numeric value axis now opts into
  the same `autoRotate`/`maxTicks` tick-collision avoidance already used by
  LineChart/AreaChart's date axis: ticks tilt -45° before thinning, and only
  thin (keeping the first + last tick) once even tilted labels would still
  collide. Byte-identical output whenever ticks already fit without overlap.

  Shared y-band row labels (`.mv-ylabel`, used by every band-axis chart:
  ComparableHorizontalBarChart, GapChart, VerticalStackBarChart, BarBell) now
  clamp to 2 lines with an ellipsis instead of wrapping unboundedly. The
  previous behaviour let an overlong label spill into the empty inter-band
  gap on either side - correct for an isolated long label, but adjacent rows
  that both wrap to 2+ lines spilled into the same shared gap from opposite
  directions and rendered as illegibly overlapping text. The full label
  remains available via the row's existing `title` attribute.

  Fixed: `showZeroLineForXAxis: true` alone did nothing when `showGrid` was left
  at its default (`false`, e.g. ComparableHorizontalBarChart's own resolved
  default) - the zero line's grid `<line>` was nested inside an `if (showGrid)`
  block in the shared `renderXAxisLinear`, so no grid meant no zero line either,
  contrary to every consumer's expectation that the two props are independent.
  The zero line now draws as a dedicated baseline reference regardless of
  `showGrid`; behaviour is unchanged for any consumer that already had
  `showGrid: true` (GapChart's own default, since it never set `showGrid`
  explicitly).

  ComparableVerticalBarChart: the two sub-bars' paint order was FIXED
  (valueBased always behind, valueCompared always in front, matching the legacy
  vendored chart's own static order) - so whichever field was smaller on a given
  row was drawn fully UNDER the taller one and rendered zero visible pixels,
  not merely "harder to see". Now decided per row (mirrors
  ComparableHorizontalBarChart's existing `comparableDrawOrder`): the shorter
  sub-bar always paints last/on top, so neither value is ever fully hidden
  regardless of which field it is. Colour/pattern assignment (based = hatch-
  eligible, compared = solid) is unchanged - only paint order varies.

  ComparableVerticalBarChart: the delta indicator's horizontal placement was
  ported from the legacy chart at `bandwidth/3` (offset toward the left third of
  the column, not centred) - an unintentional legacy quirk, not a deliberate
  design choice. Now centred at `bandwidth/2`.

  No breaking changes: all additions are optional/opt-in props or a provable
  no-op (rotation/thinning only activates on genuine collision); the two render-
  order/position fixes only change output for the specific cases that were
  previously broken (a row where the "expected" field isn't the taller one; any
  row with a delta indicator, which was never centred to begin with).

- Updated dependencies [bfd75d7]
- Updated dependencies [04dfb80]
- Updated dependencies [04dfb80]
  - @michi-vz/core@1.10.0

## 1.9.0

### Minor Changes

- 9386db8: Closes consumer-parity gaps found migrating sdg-trade's Scatterplot and TreemapChart, all additive and default-off (or default-zero-diff for the enum prop).

  - **ScatterChart**: `pointLabels?: boolean | { formatter? }` renders a per-point text label, painted on the SVG scaffold layer (same treatment as `deltaIndicator`) so it looks identical across `svg`/`canvas`/`webgpu`. Placement is a simplified right-of-point + overlap-hide strategy (bounding-box collision, deterministic given draw order) - intentionally NOT the legacy's d3-voronoi cell-picking (no new dependency added).
  - **ScatterChart**: `drawOrder?: "sizeDescending" | "sizeAscending"` controls bubble z-order. `"sizeDescending"` (default, zero-diff) is this chart's existing "largest bubble behind, smallest on top" ordering. `"sizeAscending"` is a genuine opt-in that flips the sort so the LARGEST bubble draws last/on top instead, reproducing the actual legacy sdg-trade z-order - confirmed by re-reading `Scatterplot.js` (ascending sort by raw size value) + `Chart.js` (draws in that array order; later SVG siblings paint over earlier ones), which shows legacy's real z-order is "large on top," not "small on top" as first assumed. This genuinely closes the drawOrder parity gap via the `sizeAscending` mode.
  - **TreemapChart**: `tileValueLabels?: boolean | { formatter? }` renders `"{value} ({pct}%)"` as a second line under the existing tile name, reusing the SAME tile-size gate the split "percent of leaf" second line already uses (`w >= 48 && h >= 34`, on top of the existing name gate `h >= 24 && w >= 30`) rather than inventing a new threshold. `fractionOfTotal` is the leaf's share of the grand total across every leaf (matching `buildTreemapContext`'s `grandTotal`).

  `pointLabels`/`tileValueLabels` absent or `false`, and `drawOrder` absent, are byte-for-byte no-ops (proven by DOM-identity tests). Wired through the WC elements (object props as `{attribute: false}`) and the Angular applicators; `@michi-vz/react`/`vue`/`svelte` need no changes since they pass props through wholesale.

- d489c39: SymbolMapChart `positionMode: "force" | "precise"` (default `"force"`, the legacy parity behaviour). `"precise"` skips the one-shot de-overlap simulation entirely: every symbol stays at its exact projected lng/lat and overlapping circles are allowed. Use it whenever the audience will read exact geographic position off the chart - the force simulation drifts symbols from their true coordinates (a cartographic-accuracy problem, and on small plots the drift can be large), which matters especially when a `geography` backdrop landmass is visible. WC attribute `position-mode`; forwarded by every wrapper.

### Patch Changes

- Updated dependencies [849fcf0]
- Updated dependencies [2303099]
- Updated dependencies [88d5d8f]
- Updated dependencies [9386db8]
- Updated dependencies [1d1a000]
- Updated dependencies [69f6b96]
- Updated dependencies [d489c39]
  - @michi-vz/core@1.9.0

## 1.8.0

### Minor Changes

- e62ad08: New chart: **ChoroplethMapChart** - the library's FIRST geo chart, a world/region
  choropleth. Migration target for legacy sdg-trade `MapChoropleth` (`Chart.js` +
  `MakeProjection.js` + `MakeColors.js`).

  - **Geography is ALWAYS a consumer prop.** `@michi-vz/core` bundles NO topology
    data - pass a GeoJSON `FeatureCollection` (its own `Feature.id`/`properties.name`
    are read automatically) or a pre-normalized `GeoFeatureItem[]`. New dependencies:
    `d3-geo` + `d3-geo-projection` (for `geoRobinson`, the default, and `geoGilbert`);
    tree-shaking verified - an esbuild bundle importing only `mountLineChart` from the
    built `dist/index.js` contains zero `geoRobinson`/`geoGilbert`/choropleth symbols.
  - All 13 `d3-geo`/`d3-geo-projection` projections (`geoEqualEarth`, `geoMercator`,
    `geoTransverseMercator`, `geoAlbers`, `geoAlbersUsa`, `geoAzimuthalEqualArea`,
    `geoAzimuthalEquidistant`, `geoOrthographic`, `geoConicConformal`,
    `geoConicEqualArea`, `geoConicEquidistant`, `geoRobinson`, `geoGilbert`).
    `projectionConfig` defaults (rotate `[-18, 0]`, center `[0, 10]`, a width-derived
    base scale) reproduce the legacy chart's own default view exactly, rather than
    `projection.fitSize`.
  - `dataSet` rows (`{ id, label, value?, color? }`) join geography features by
    `joinBy: "id"` (default - ISO-A3-style codes, matches sdg-trade's real indicator
    map consumer) or `"name"` (matches the legacy chart's own default, for data keyed
    by country name).
  - Colour resolution: `colorsMapping` (categorical - the sdg-trade Data Availability
    use case) wins over `colorScale` (continuous - a resolved hex `range` + numeric
    `domain` built into a d3 `scaleThreshold`; core stays free of
    `d3-scale-chromatic`) wins over the row's own `color` wins over the palette.
    Unmatched features render `noDataColor` (default `#d2d7dd`, ported from
    `colors.WHITE_SMOKE_DARKEST`).
  - Canvas renderer draws via `geoPath(projection, ctx)` (d3-geo renders natively to
    a 2D context - no path-string reparsing). WebGPU renderer DELEGATES to the
    canvas-2D renderer rather than tessellating arbitrary polygons on the GPU
    (real-world regions are frequently concave/multi-ring/hole-containing; correct
    GPU triangulation needs real ear-clipping, disproportionate scope here) -
    documented at length in `renderWebgpu.ts`; always paints synchronously.
  - Host-level hover hit-test for canvas/webgpu mode uses pure-JS even-odd
    ray-casting against the re-projected raw geometry (handles holes correctly,
    works identically under jsdom and in the browser - no Canvas 2D `isPointInPath`
    dependency).
  - `buildChoroplethMapContext`: stats over the JOINED values (matched/unmatched
    counts, min/max), NL summary, a11yTable listing every region + value +
    matched flag. `checkChoroplethMapData` flags unmatched dataSet ids, features
    missing an id, and invalid/empty geometry.
  - Full `isLoading`/`isNodata`/`noDataLabel`/`suppressDefaultOverlay` chrome quad,
    `highlightItems`/`disabledItems` dimming, `skipColorMappingDispatch`,
    `tooltipFormatter` (matched rows get the full `ChoroplethDataItem`; unmatched
    features get the fallback `{ id, name }` shape).
  - Wrappers: `<michi-vz-choropleth-map-chart>` (wc), `ChoroplethMapChart` (React,
    Vue), `choroplethMapChart` action (Svelte), `applyChoroplethMapChartProps`
    (Angular).

- 57a9150: New chart: **ComparableVerticalBarChart** - per-category comparison columns, the
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

- 17be1b0: New chart: **RadialTreeChart** - chart #21, the last new engine of the
  sdg-trade migration: a radial cluster()/dendrogram. Migration target for
  legacy sdg-trade `TreeRadial` (`Chart.js`).

  - d3-hierarchy `cluster()` - NOT `tree()` - verified against the legacy
    chart's exact layout call. `cluster()` places every leaf at the SAME
    radial distance from the centre (a true dendrogram); `tree()` would size
    each branch by its own subtree depth instead.
  - `RadialTreeNode` deliberately mirrors `TreemapNode`'s shape
    (label/code/value/color/children) for API consistency across the two
    hierarchical charts. A node's colour group is its TOP-LEVEL ancestor's
    label, exactly like TreemapChart - verified against the legacy chart's
    `groupBy`, which copied the same `colorValueKey` field onto a group AND
    every one of its children. A group's own value is always the sum of its
    children (an explicit `value` on a node with `children` is ignored).
  - Dual-level sized circles: a LINEAR scale (verified against the legacy
    chart's own `scaleLinear` - it is NOT a sqrt scale) over the combined
    domain of every group's AND every leaf's own value, applied at every
    depth via `radiusRange` (default `[2, 32]`, the legacy `circleRange`).
  - Adaptive label density via `labelDensityThresholds` (`rotateAbove`
    default 20, `hideAbove` default 100 - the legacy `rotateItemThreshold`
    and its unnamed 100-leaf cutoff): full name+value at low density,
    abbreviate-to-3-letters + rotate radially past `rotateAbove`, hide
    entirely past `hideAbove`. A depth-1-only 10-character truncation in the
    medium-density band is preserved as a documented legacy quirk.
  - `centerLabel` (legacy `titleCenter`) draws a small centre circle with the
    title word-wrapped to ~10 characters/line - a simplified, deterministic
    port of the legacy pixel-width-aware wrap.
  - Links: cubic-bezier dendrogram spokes, control points ported from the
    legacy chart's `projection()` + inline path builder; rendered as one
    background layer (a documented, cosmetic z-order simplification vs. the
    legacy per-node DOM interleaving - a link never visually covers a circle).
  - Canvas colour probe: single-element `circle.radial-tree-node-circle
[data-label-safe]`, keyed by the group. WebGPU DELEGATES to canvas-2D
    (same rationale as ChoroplethMap/SymbolMap: the curved bezier links
    aren't cheaply GPU-tessellable).
  - `buildRadialTreeContext`: leaf/group counts, grand total, min/max
    leaf, max nesting depth, NL summary, a11yTable. `checkRadialTreeData`
    flags empty datasets, empty groups (an explicit empty `children` array),
    negative/non-finite values, duplicate labels anywhere in the tree, and
    nesting deeper than the 2-level (group + leaf) contract (new
    `empty-group` / `excess-depth` `DataWarning` types, additive to the
    shared union) - deeper nesting is tolerated, not rejected: every extra
    level still gets a sized circle and a link.
  - Full `isLoading`/`isNodata`/`noDataLabel`/`suppressDefaultOverlay`
    chrome quad, `highlightItems`/`disabledItems` (dimming checked by a
    node's own label OR its group label), `skipColorMappingDispatch`,
    `tooltipFormatter`.
  - Wrappers: `<michi-vz-radial-tree-chart>` (wc), `RadialTreeChart` (React,
    Vue), `radialTreeChart` action (Svelte), `applyRadialTreeChartProps`
    (Angular).

- f109971: New chart: **SymbolMapChart** - chart #20, a force-de-overlapped symbol/bubble
  map. Migration target for legacy sdg-trade `MapSymbolForce` (`Chart.js` +
  `ForceNode.js`) - a dot-only bubble map where each item's coordinates project
  onto the plane, then a one-shot force simulation nudges overlapping circles
  apart without moving them far from their true position.

  - **Consumers supply lng/lat per item** (`SymbolMapDataItem`). Unlike the
    legacy chart's bundled ~200-row static country coordinate CSV, `@michi-vz/core`
    ships no coordinate table.
  - Two projection modes: **dot-only** (no `geography`, the default - legacy
    parity) uses the chosen projection UNTUNED (bare factory(), no translate/
    scale/rotate/center) then rescales the projected point extent to fill the
    plot, mirroring the legacy chart's own xScale/yScale-over-extent math.
    **Backdrop** (`geography` supplied - a NEW capability the legacy chart never
    had) reuses ChoroplethMapChart's tuned projection dispatch, so the muted
    landmass layer and the symbol coordinates share one consistent geographic
    framing. `geo/projections.ts` (the shared factory map + tuned-projection
    formula) was mechanically extracted out of `choroplethMap/scales.ts` for
    this reuse; `ChoroplethMapChartProps`'s own public API is unchanged.
  - The one-shot de-overlap: `forceX`/`forceY` pin the simulation to each item's
    true projected position (the exact target snapshotted at force-attach time),
    `forceManyBody()` adds mild separation, `forceCollide` (radius + 2px, 3
    iterations) resolves overlaps. Settles synchronously to the legacy alpha
    threshold (`0.0011`) on a `.stop()`ped simulation - deterministic: identical
    inputs always settle to the identical layout.
  - `radiusVisibleMin` filters on the RAW `value`/`valueSecond` (verified against
    the legacy source: strictly before radius scaling) - ported exactly,
    including the "domain floor raised to `radiusVisibleMin` when the max value
    exceeds 100" quirk.
  - **Deliberate divergence from legacy**: the radius/opacity scale's domain is
    the TRUE combined extent of every item's `value`/`valueSecond`, NOT legacy
    Chart.js's own domain formula (`[min(primaryMin, secondaryMax),
max(primaryMin, secondaryMax)]`), which was defective and silently dropped
    the primary max and secondary min - so relative circle sizes differ from
    legacy whenever `value`/`valueSecond` ranges diverge.
  - The concentric second ring (`valueSecond`) ports legacy `ForceNode.js`'s
    exact layering: same colour as the primary circle, `opacity - 0.3` (clamped
    to non-negative), drawn on top.
  - Canvas colour probe: single-element `circle.symbol[data-label-safe]`, same
    convention as BubbleChart. WebGPU renderer DELEGATES to canvas-2D (same
    rationale as ChoroplethMap: the optional backdrop is arbitrary,
    possibly-concave GeoJSON).
  - `buildSymbolMapContext`: stats separate located/visible/hidden(by
    `radiusVisibleMin`)/invalid(bad coordinates) counts, min/max, NL
    summary, a11yTable. `checkSymbolMapData` flags missing/invalid lng-lat,
    negative values, and duplicate ids.
  - Full `isLoading`/`isNodata`/`noDataLabel`/`suppressDefaultOverlay` chrome
    quad, `highlightItems`/`disabledItems`, `skipColorMappingDispatch`,
    `tooltipFormatter`.
  - Wrappers: `<michi-vz-symbol-map-chart>` (wc), `SymbolMapChart` (React, Vue),
    `symbolMapChart` action (Svelte), `applySymbolMapChartProps` (Angular).
  - New core dependency: `d3-array` (`extent`, for the rescale-to-fill math).

### Patch Changes

- Updated dependencies [e62ad08]
- Updated dependencies [57a9150]
- Updated dependencies [17be1b0]
- Updated dependencies [f109971]
  - @michi-vz/core@1.8.0

## 1.7.0

### Minor Changes

- 3c0bc4b: New `stackOffset: "none" | "expand"` on AreaChartProps (default `"none"`, zero change).

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
    y-axis _display_ range to `[0,100]` without touching the underlying stacked values;
    that prop's behavior is unchanged.
  - Exposed on the web component (`stack-offset` attribute) and `applyAreaChartProps`;
    Vue/Svelte/React need no changes (whole-props pass-through).

  - Migration note: expand mode's default y-tick formatter is Intl percent with
    0 fraction digits; consumers needing legacy variable-precision labels (e.g.
    sdg-trade's ONEHUNDREDPERC mode) should pass an explicit `yAxisFormat`. When
    `stackOffset: "expand"` is combined with `forcePercentageScale`/`yAxisDomain`,
    the normalized `[0,1]` domain wins.

- d920094: RadarChart, SankeyChart, and TreemapChart gain the full loading/no-data prop quad
  (`isLoading`, `isNodata`, `noDataLabel`, `suppressDefaultOverlay`), wired through
  the shared `applyChartChrome` helper like the already-converged charts. Engines now
  stamp `data-mv-state="loading" | "nodata" | "ready"` on the host element.

  - React wrappers for these three charts gain `isLoadingComponent` /
    `isNodataComponent` (ReactNode overlays rendered over the still-mounted host).
  - **React DOM-shape note:** the React wrappers for Radar/Sankey/Treemap now
    unconditionally wrap the chart host in
    `<div class="michi-vz michi-vz-react-host" style="position:relative">` (the same
    structure Gap/Line already use) — required by the mounted-overlay mechanism. If
    your CSS or DOM-walking code assumed the old direct-child structure for these
    three charts, adjust the selector.
  - RadarChart's pre-existing `isLoading` was a dead no-op (its CSS class landed on
    an element the stylesheet's descendant selector never matched); it now shows a
    real overlay, matching its documented intent.

- d920094: New `deltaIndicator?: DeltaIndicatorConfig` on ComparableBarChartProps.

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

- d920094: New `layout: "overlay" | "grouped"` on ComparableBarChartProps (default `"overlay"`, zero change).

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

- 2b68160: New `yAxisScale: "linear" | "log"` on LineChartProps (default `"linear"`, zero change).

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

### Patch Changes

- Updated dependencies [3c0bc4b]
- Updated dependencies [d920094]
- Updated dependencies [d920094]
- Updated dependencies [d920094]
- Updated dependencies [2b68160]
  - @michi-vz/core@1.7.0

## 1.6.0

### Minor Changes

- 680b89a: Legacy-parity fixes for Ribbon and Comparable, a new BarBell axis option, and legendData on five more contexts.

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
  - **New `interactiveRowLabels` on Gap, Comparable, and Dual (tornado)**: hovering
    or keyboard-focusing a row label draws a leader line to the row's marks, shows
    the row's tooltip, and highlights it; clicking pins the tooltip (the same
    sticky contract as the marks). The label gutter also scrubs like a slider:
    dragging along it moves the leader from row to row with the tooltip tracking
    the cursor, reaching rows whose labels were thinned away on a dense axis
    (the host canvas hit-test stands down while a scrub is active, so the two
    never fight). Labels become focusable buttons, and the leader lives on the
    SVG axis layer so it works in svg, canvas, and webgpu modes. Theme it via the
    `--michi-vz-crosshair*` vars (`.mv-row-leader`). Default off. The dual
    chart's context summary now also names the largest imbalance
    (`stats.largestImbalance`).
  - **New `yAxisPosition: "center" | "left"` on DualBarChartProps** (default "center",
    the legacy tornado look): "left" moves the row labels into the left margin,
    clear of the left-extending bars - the classic population-pyramid layout.
    Exposed on the web component (`y-axis-position`) and
    `applyDualHorizontalBarChartProps`.
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

### Patch Changes

- Updated dependencies [322ea0c]
- Updated dependencies [e063c94]
- Updated dependencies [680b89a]
  - @michi-vz/core@1.6.0

## 1.5.6

### Patch Changes

- Updated dependencies [55e21f9]
  - @michi-vz/core@1.5.6

## 1.5.5

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.5

## 1.5.4

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.4

## 1.5.3

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.3

## 1.5.2

### Patch Changes

- Updated dependencies [18b92b4]
  - @michi-vz/core@1.5.2

## 1.5.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.1

## 1.5.0

### Minor Changes

- cdf1e8d: First public release of @michi-vz/devtools: the in-page chart devtools panel (no browser extension needed).

  - Panel now renders in its own Shadow DOM (style isolation; `getRoot()` on the handle) with light AND dark themes (auto via prefers-color-scheme, or an explicit `theme` option)
  - New Sizing tab: host rect vs requested width/height, zero-size detection, the clientWidth-includes-padding overflow trap, and a ResizeObserver recipe
  - New Scales tab: x/y axis domains with NaN / inverted / zero-width sanity checks
  - New Diff tab: deep diff between ChartContext history snapshots (`diffObjects` exported)
  - New Insights tab: the chart summary AI-styled, plus one-click Narrate / Detect anomalies (with flagged-series highlighting) / Forecast when @michi-vz/insights is attached; raw tool runner moved under Advanced
  - New Hit-test tab: live canvas pointer log + hit/miss marker over the chart host (a dead canvas listener is visible as a silent log)
  - New Profiler tab: per-update render durations (last/mean/max, bar strip, trending-up warning)
  - New A11y tab: Chartability-inspired audit (missing summary, incomplete a11y table, duplicate series colors, low graphic contrast on light/dark) + the a11y table itself; `auditContext`/`contrastRatio`/`findDuplicateColors` exported
  - New inert `@michi-vz/devtools/production` entry for prod-safe conditional imports
  - Panel is resizable: wider 560px default, drag the top-left corner to grow (size remembered per browser), and a maximize/restore header button
  - Many-chart pages: a filter box over the chart list, a per-chart locate button (scrolls the chart into view and flashes an outline), and burst-coalesced re-renders past 8 charts (one trailing refresh instead of N)
  - Reset chart button (Overview): restores dataSet/highlight/disable to their state when devtools first saw the chart, undoing every panel-driven edit at once
  - AI actions are self-explaining: a caption + per-action tooltips state that the defaults are deterministic rules and statistics (no language model, nothing downloaded); calmer Nordic palette for the AI accents and shadows

  @michi-vz/insights: new ready-made backend:"remote" callers for local AI - `ollamaCaller({ model, url? })` (native Ollama API) and `openaiCompatCaller({ url, model, apiKey? })` (LM Studio, llama.cpp server, vLLM, LocalAI, hosted OpenAI-compatible APIs); both throw on failure so narration falls back to the rule-based text.

  @michi-vz/insights: model downloads are now transparent and configurable - `describeModelSource(backend, model, source?)` states exactly what a backend downloads and from where (Transformers.js default: https://huggingface.co; WebLLM: its HF-hosted prebuilt registry; remote/rules: nothing); new `modelSource` option on `explainChart`/`createEmbedder` redirects downloads to a mirror host or a self-hosted `localModelPath` (with `allowRemoteModels:false` for offline/intranet), and `webllmAppConfig` self-hosts WebLLM weights. `backend:"remote"` + `caller` remains the zero-download path to your own API (e.g. local Ollama).

  @michi-vz/core: the devtools hook gained high-frequency channels - `reportHit`/`subscribeHits` (canvas hit-test stream; scatter, bubble and treemap engines report their host hit-tests via the new `reportDevtoolsHit`, zero cost when devtools is off) and `reportTiming`/`subscribeTimings` (attachDevtools times every update()).

  @michi-vz/insights: the narrate(), anomaly() and forecast() plugins now expose their capability as agent tools via provideTools (discoverable through chart.getTools(), powering the devtools Insights tab and any agent host).

  @michi-vz/react: new `<MichiVzDevtools />` convenience component - renders nothing, mounts the panel while in the tree; dev-only by default (NODE_ENV-gated dynamic import, so production bundles drop the devtools chunk), `forceMount` opts a build in deliberately.

### Patch Changes

- Updated dependencies [cdf1e8d]
  - @michi-vz/core@1.5.0

## 1.4.0

### Minor Changes

- `<michi-vz-line-chart>`: the hover crosshair (`enableMouseLine`) defaults to ON (legacy parity) and now also accepts a `MouseLineConfig` object (`{ stroke, strokeWidth, strokeDasharray, snap }`) via the `enableMouseLine` property; the `enable-mouse-line` attribute still opts in explicitly, and setting the property to `false` opts out.

### Patch Changes

- Updated dependencies:
  - @michi-vz/core@1.4.0

## 1.3.0

### Minor Changes

- LineChart/AreaChart x-axis: the first + last periods are never dropped, crowded labels auto-rotate then thin to ~5, and the opt-in `fillPeriodTicks` continuous-timeline mode (faded no-data ticks + a "no data" hover tooltip, customizable via `noDataTickTooltip` / `noDataTickColor`). New props forwarded by the `<michi-vz-line-chart>` / `<michi-vz-area-chart>` element (`fill-period-ticks` attribute + reactive properties).

### Patch Changes

- Updated dependencies:
  - @michi-vz/core@1.3.0

## 1.2.1

### Patch Changes

- docs: add a Framework packages cross-link table to every package README and fix the dead monorepo link, so each npm page links to all the sibling wrappers. Also aligns vue/angular/svelte/wc to the same release as core/react.
- Updated dependencies
  - @michi-vz/core@1.2.1

## 1.2.0

### Minor Changes

- 084458f: Full core-prop parity across every framework wrapper. The wrappers previously forwarded only a curated subset of each chart's props; now all five outputs expose the complete `@michi-vz/core` prop surface for all 17 charts.

  - **`@michi-vz/wc`** - each `<michi-vz-*-chart>` Lit element gained the previously-omitted props as reactive properties + `chartProps` forwards (183 props total): layout/format props (`margin`, `colors`, `xAxisFormat`, `yAxisFormat`, `ticks`, `tickValues`, `enableTransitions`, `filter`), per-chart additions (ComparableBar `maxBarHeight` / `symmetricXDomain` / `patternsMapping` / `showZeroLineForXAxis` / `hideTickLabels` / `horizontalTickPosition`; Scatter crosshair suite + `dScaleLegend` / `yTicksQty` / `showGrid` / `pinIcon`; VSB `xAxisLabelPadding` / `minBarWidth` / `minBarHeight` / `yTicks` / `showGridLines` / `highlightZeroLine` / `fontFamily`; Gap `colorMode` / `shapeColorsMapping` / `shapesLabelsMapping` / `showLegend` / `legendAlign` / `enableExplicitTickValues`; Radar `poles` / `showFilled` / `showDimmedFill` / label formatters; BarBell `dodgeOverlappingCaps`; `svgChildren` on Line + Scatter), and the `isLoading` / `isNodata` / `noDataLabel` overlay controls. Object/array/function props are declared `attribute: false`.
  - **`@michi-vz/angular`** - every `apply<Name>ChartProps` applicator now forwards the matching element's full property set (193 added forwards), including the previously-drifted `applyLineChartProps` / `applyFanChartProps` (which had lagged their WC elements). `title` → `chartTitle` and `style` → `fountainStyle` mappings preserved.
  - **`@michi-vz/vue` / `@michi-vz/svelte`** - already pass the whole props object through, so they expose the full surface (and the latest core engine fixes) on rebuild; no API change, re-released for parity.

  Internal-only flags (`suppressDefaultOverlay`) and the `on*` callbacks (WC dispatches these as DOM `CustomEvent`s) are intentionally not forwarded as plain data props. A static parity-guard test (`apps/docs/scripts/wrapper-parity.test.mjs`) now fails CI if any wrapper falls behind the core type.

## 1.1.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.1.1

## 1.1.0

### Minor Changes

-

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.1.0
