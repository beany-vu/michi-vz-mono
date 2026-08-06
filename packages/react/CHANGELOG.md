# @michi-vz/react

## 1.11.7

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.18.0
  - @michi-vz/devtools@0.2.22

## 1.11.6

### Patch Changes

- Updated dependencies [d4ca9d9]
  - @michi-vz/core@1.17.0
  - @michi-vz/devtools@0.2.21

## 1.11.5

### Patch Changes

- Updated dependencies [4c71e2b]
  - @michi-vz/core@1.16.2
  - @michi-vz/devtools@0.2.20

## 1.11.4

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.16.1
  - @michi-vz/devtools@0.2.19

## 1.11.3

### Patch Changes

- Updated dependencies [5ccc78c]
  - @michi-vz/core@1.16.0
  - @michi-vz/devtools@0.2.18

## 1.11.2

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.15.0
  - @michi-vz/devtools@0.2.17

## 1.11.1

### Patch Changes

- Updated dependencies [17abc81]
  - @michi-vz/core@1.14.0
  - @michi-vz/devtools@0.2.16

## 1.11.0

### Minor Changes

- 486978e: New chart #22: GaugeChart - a concentric ring gauge (`mountGaugeChart` / `<GaugeChart>` / `<michi-vz-gauge-chart>`). One ring per dataSet item (outer to inner), each sweeping value/max of a full circle clockwise from `startAngle` over a background track; a null value renders the track only. Configurable ring thickness/gap, per-ring arc + track colours and opacities, rounded caps, `defaultActive` resting ring, hover activation with `onHighlightItem`, a built-in centre readout (`showCenterLabel` / `centerContent` / `valueFormatter` / `noValueLabel`), an opt-in `tooltipFormatter`, and svg / canvas / webgpu renderers sharing the standard colour-probe contract. Ships with ChartContext + legendData + a11y mirror, loading/no-data chrome, docs (4 locales), and examples.
- 486978e: Export: `chartToPngDataUrl` gains `title` / `caption` text blocks (word-wrapped, alignment/size/colour configurable via `PngTextBlock`) composited above/below the chart, plus `textFontFamily`.

  LineChart: opt-in x-axis drag-to-zoom. New `zoom` prop (`boolean | LineZoomConfig` with `minRange`, `resetButton`, `resetLabel`), `onZoomChange` callback (WC event `michi-vz:zoomchange`), and `resetZoom()` / `setZoomDomain()` instance + React handle methods. Dragging a horizontal range inside the plot zooms the x-domain: marks clip to the plot box (SVG clipPath wrapper / canvas ctx.clip), axis ticks, crosshair snapping, and tooltips follow the zoomed domain, and a built-in "Reset zoom" chip restores the full view. The y-domain intentionally stays full. The webgpu renderer falls back to canvas while zoomed (no clip support there).

### Patch Changes

- Updated dependencies [486978e]
- Updated dependencies [486978e]
  - @michi-vz/core@1.13.0
  - @michi-vz/devtools@0.2.15

## 1.10.4

### Patch Changes

- Updated dependencies [3dab6e7]
  - @michi-vz/core@1.12.2
  - @michi-vz/devtools@0.2.14

## 1.10.3

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.12.1
  - @michi-vz/devtools@0.2.13

## 1.10.2

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.12.0
  - @michi-vz/devtools@0.2.12

## 1.10.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.11.1
  - @michi-vz/devtools@0.2.11

## 1.10.0

### Minor Changes

- a6e7db1: Play-through-years `timeline` on all 21 charts, reveal animation on every chart, and an animation-resume fix.

  - New opt-in `timeline` prop (off by default) with a built-in play button + year scrubber and a headless controller (`chart.timeline()`, wc `getTimeline()`, React handle `timeline()`). Semantics per chart family: time-axis charts (Line, Area, Range, Fan, VerticalStackBar, Ribbon, Fountain trend mode) draw their marks up to the active year and sweep between years; snapshot charts (Gap, Scatter, Pie, Bubble, both Comparable bars, Dual, ChoroplethMap, SymbolMap) show one period's rows at a time with values tweening between periods; Treemap and RadialTree snapshot via `date`-tagged root nodes with the whole hierarchy tweening; Sankey via `date`-tagged links; Radar and BarBell via a new `period` row field (their `date` already means something else). LineChart's timeline supports `tipLabel` riding the growing line.
  - New opt-in `progressiveDraw` prop: LineChart draws itself left to right with optional tip labels following each line's end; the other charts get a clip-based reveal wipe. `replay()` re-runs it (core instance, wc element, React handle). `timeline` wins when both are set.
  - Both features work in `svg` and `canvas` render modes, respect `prefers-reduced-motion` (instant, no animation), never alter `getContext()`/a11y output, and are inert on the experimental `webgpu` renderer (full frame paints instantly).
  - Fix: a re-render during a running animation now resumes it from its current position instead of jumping to the end. Framework wrappers call `update()` immediately after mount, which previously cancelled every mount autoplay.
  - New `date?` fields on TreemapNode, RadialTreeNode, SankeyLinkItem and `period?` on RadarDataItem, BarBellDataRow; `MountOptions` gains optional `ticker`/`motion` injection for deterministic animation tests. No API removed or renamed.

### Patch Changes

- Updated dependencies [9c0d6ae]
- Updated dependencies [a6e7db1]
  - @michi-vz/core@1.11.0
  - @michi-vz/devtools@0.2.10

## 1.9.0

### Minor Changes

- bfd75d7: Add chart export helpers so consumers can download a chart as a correctly-styled image or CSV.

  - **`@michi-vz/core`**: new framework-agnostic helpers — `chartContextToCsv(ctx)` serializes any chart's `getContext().a11yTable` (the full, untruncated data table every chart carries) to RFC-4180 CSV with no per-chart code; `chartToStyledSvgString(el)` / `chartToStyledSvgDataUri(el)` rebuild a standalone SVG with `CORE_CSS` inlined, fixing the long-standing problem that the chart CSS lives in `document.adoptedStyleSheets` and is invisible to `XMLSerializer` / `save-svg-as-png` (exported images lost gridlines, axis labels and the zero-line); `chartToPngDataUrl(el)` rasterizes to PNG and composites canvas-renderer marks over the SVG axes.
  - **`@michi-vz/react`**: every chart handle now exposes `getElement()` (alongside the existing `getContext()`) returning the chart host element, so consumers get a scoped reference to feed the export helpers instead of a fragile global DOM query.
  - **LineChart `sharedTooltip`** (+ optional `sharedTooltipFormatter`): when on, hovering anywhere in the plot shows ONE tooltip listing every series' value at the nearest x (year), alongside the crosshair, instead of the single nearest series. Forwarded by the WC (`shared-tooltip`) and Angular wrappers; React passes it through.
  - **LineChart `a11yTable`** is now a wide per-period table (one column per distinct x value, labelled like the axis; one row per series, `-` for gaps) instead of a per-series summary — so a CSV export off `getContext()` carries every plotted point (e.g. one column per year), and the a11y mirror shows the data itself. Per-series stats stay on `context.series`/`stats`; the narrative stays on `context.summary`.

  No API removed or renamed. The only behavior change is the LineChart `a11yTable` shape above (its `summary` and `series` fields are unchanged).

### Patch Changes

- Updated dependencies [bfd75d7]
- Updated dependencies [04dfb80]
- Updated dependencies [04dfb80]
  - @michi-vz/core@1.10.0
  - @michi-vz/devtools@0.2.9

## 1.8.1

### Patch Changes

- Updated dependencies [849fcf0]
- Updated dependencies [2303099]
- Updated dependencies [88d5d8f]
- Updated dependencies [9386db8]
- Updated dependencies [1d1a000]
- Updated dependencies [69f6b96]
- Updated dependencies [d489c39]
  - @michi-vz/core@1.9.0
  - @michi-vz/devtools@0.2.8

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
  - @michi-vz/devtools@0.2.7

## 1.7.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [3c0bc4b]
- Updated dependencies [d920094]
- Updated dependencies [d920094]
- Updated dependencies [d920094]
- Updated dependencies [2b68160]
  - @michi-vz/core@1.7.0
  - @michi-vz/devtools@0.2.6

## 1.6.5

### Patch Changes

- Updated dependencies [322ea0c]
- Updated dependencies [e063c94]
- Updated dependencies [680b89a]
  - @michi-vz/core@1.6.0
  - @michi-vz/devtools@0.2.5

## 1.6.4

### Patch Changes

- Updated dependencies [55e21f9]
  - @michi-vz/core@1.5.6
  - @michi-vz/devtools@0.2.4

## 1.6.3

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.5
  - @michi-vz/devtools@0.2.3

## 1.6.2

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.4
  - @michi-vz/devtools@0.2.2

## 1.6.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.3
  - @michi-vz/devtools@0.2.1

## 1.6.0

### Minor Changes

- 723a623: DevTools now opens the way you expect from a devtools overlay: mounting it shows a small floating button bearing the Michi shield (the library's crest) instead of covering the app with the panel. Click the button (or Ctrl/Cmd+Shift+M) to open; the open/closed state is remembered per browser, so a reload comes back exactly how you left it (an explicit `open: true/false` still forces the initial state). The button is draggable anywhere on screen and the dragged spot is remembered, so it never fights another floating widget for a corner; the new `buttonPosition` option ("bottom-right" default, or any corner) picks where it starts. The handle gained `isOpen()` (the `/production` stub always reports false), and `<MichiVzDevtools />` in `@michi-vz/react` passes through the new `buttonPosition` prop.

### Patch Changes

- Updated dependencies [723a623]
- Updated dependencies [18b92b4]
  - @michi-vz/devtools@0.2.0
  - @michi-vz/core@1.5.2

## 1.5.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.1
  - @michi-vz/devtools@0.1.1

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
  - @michi-vz/devtools@0.1.0
  - @michi-vz/core@1.5.0

## 1.4.0

### Minor Changes

- LineChart hover crosshair is ON by default again (legacy `michi-vz` parity), snaps to the nearest data point x, hides on mouseleave, and `enableMouseLine` now also accepts a `MouseLineConfig` object (`{ stroke, strokeWidth, strokeDasharray, snap }`). Flows through automatically (props type extends the core `LineChartProps`).

### Patch Changes

- Updated dependencies:
  - @michi-vz/core@1.4.0

## 1.3.0

### Minor Changes

- LineChart/AreaChart x-axis: the first + last periods are never dropped, crowded labels auto-rotate then thin to ~5, and the opt-in `fillPeriodTicks` continuous-timeline mode (faded no-data ticks + a "no data" hover tooltip, customizable via `noDataTickTooltip` / `noDataTickColor`). New props flow through automatically (props type extends the core `*Props`).

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

- **thd drop-in compatibility release.**

  - `MichiVzProvider` + `useChartContext` - React context (`createMichiVzStore` + `useSyncExternalStore`) carrying `colorsMapping`, `highlightItems`, `disabledItems`, `hiddenItems`, `visibleItems`, `fontFamily`, `singlePointLine`, `categoryMetadata`, `colorsBasedMapping`, `locale`, `dir`. Merged into chart props via `resolveEffectiveProps`; returns empty defaults with no provider mounted.
  - Overlay props on the chart wrappers - `isLoadingComponent` / `isNodataComponent` (`ReactNode`) rendered over the still-mounted host (the chart never unmounts).
  - `LineChart` and `ScatterChart` accept JSX `children`, serialised (`renderToStaticMarkup`) into the engine's `svgChildren` slot - e.g. an axis-title `<text>`.
  - `RadarChartSet` orchestrator - fans out one `<RadarChart>` per item, merging per-child `colorsMapping` + de-duplicated `legendData`.
  - `ScatterPlotChart` alias of `ScatterChart` (+ `ScatterPlotChartProps` / `ScatterPlotChartHandle`) for legacy-name parity.

### Patch Changes

- Updated dependencies:
  - @michi-vz/core@1.2.0

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
