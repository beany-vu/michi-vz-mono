# @michi-vz/core

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

- 322ea0c: Dense band axes now thin their labels to a readable subset instead of smearing.

  - `renderYAxisBand` (Gap, Comparable, Dual, Bar-Bell row labels): when bands are
    shorter than a text line, label an even subset (endpoints kept, numeric domains
    snapped to round values) and thin the per-band grid with it. New optional
    `maxTicks` on `YAxisBandOptions`. Marks and tooltips still render for every row.
  - FountainChart snapshot mode now lays out its band x-axis with the shared
    `chooseAxisMode` policy (fit, else rotate with reserved bottom margin, else thin).
  - insights: the exported `version` constant is now stamped from package.json at
    build time (it had drifted to "0.1.0"), so it can never go stale again.

- e063c94: FountainChart (experimental): symmetry now carries meaning, so `lean` is a real flag.

  - An explicit `lean: 0` stands the jet truly upright (before, it was coerced into the
    decorative drift and an upright jet was impossible). A signed `lean` bends the crown
    toward the heavier side; an item with NO `lean` keeps the gentle decorative wind drift.
  - `getContext().jets[]` now carries `lean`: the clamped signed value when the item encodes
    one, or `null` when the drift is purely decorative - so consumers can tell flag from
    flourish. Applies to SVG, canvas, and WebGPU alike (shared render model).

## 1.5.6

### Patch Changes

- 55e21f9: VerticalStackBarChart: keep disabled keys in legendData flagged `disabled: true` (legend pill dims instead of disappearing, matching LineChart's contract); colour slots are assigned over the full key set so no key changes colour across a disable/enable toggle. Bars still exclude disabled keys.

## 1.5.5

### Patch Changes

- Add range-aware GapChart domain padding so percentage baseline markers at zero do not overflow the visible axis.

## 1.5.4

### Patch Changes

- Fix GapChart mark/axis overflow when `tickValues` are supplied but `enableExplicitTickValues` is disabled.

## 1.5.3

### Patch Changes

- Harden GapChart explicit tick handling by filtering non-finite values, sorting and de-duplicating consumer-provided ticks, and falling back to finite data domains for degenerate tick inputs.

## 1.5.2

### Patch Changes

- 18b92b4: Heavy-chart performance bug fixes (the "page with a 50k-point scatter feels laggy" report):

  - **Bounded context signature.** The `onChartDataProcessed` idempotency guard signed the whole context with `JSON.stringify`, serializing `a11yTable.rows` (one row per datum) and `legendData` on every render - a multi-MB string for a 50k-point scatter, twice at mount on WebGPU-capable browsers. The a11y mirror caps its rendered table at 100 rows, but the signature bypassed that cap. All 8 engines that used the pattern (scatter, line, area, gap, bar-bell, vertical-stack-bar, comparable-horizontal-bar, radar) now sign through a shared `contextSignature` helper: the two per-datum fields are folded through FNV-1a and only the small remainder is stringified. Change-detection semantics are unchanged; the signature stays a few hundred bytes at any data size.
  - **rAF-throttled scatter hover.** The canvas/WebGPU hit-test scanned every point on every `mousemove` (50k `Math.hypot` calls per event, several events per frame) and re-resolved the props each time. The first event of a burst still processes synchronously; the rest of the frame collapses into one trailing `requestAnimationFrame` pass over the latest event, and the resolved renderer is cached per render. Pending passes are cancelled on `destroy()`.
  - **Skip the z-order sort when radii are uniform.** The scatter render model sorted all points by radius on every render even when `sizeRange` is pinned or no point has a `d` value (the sort is stable, so the order could not change).
  - `makeLayerCanvas` reads `getComputedStyle(host)` once instead of twice.
  - `@webgpu/types` is now a declared devDependency of core (it was previously resolved from an undeclared install and a fresh `pnpm install` broke `typecheck`).

## 1.5.1

### Patch Changes

- Sticky (click-to-pin) tooltips now dismiss on a click anywhere outside the chart and tooltip (legacy parity - previously only VerticalStackBarChart did; the other 16 engines left the pinned tooltip stuck with hover disabled). The tooltip click listener and the new document-level listener are now removed in destroy(), fixing a per-remount listener leak.

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

## 1.4.0

### Minor Changes

- **LineChart hover crosshair restored to legacy behavior and made configurable.** `enableMouseLine` is ON by default again (legacy `michi-vz` parity - the port had silently flipped it off, so drop-in consumers lost the line), and the vertical line now SNAPS to the nearest data point x (instead of trailing the raw cursor), hides on mouseleave, and works identically in svg, canvas, and webgpu render modes. The prop also accepts a `MouseLineConfig` object (`{ stroke, strokeWidth, strokeDasharray, snap }`), and the look themes via the new `--michi-vz-crosshair` / `--michi-vz-crosshair-width` / `--michi-vz-crosshair-dash` CSS vars (default: solid 1px `#a9a9a9`, the legacy grey). Pass `enableMouseLine={false}` to opt out.

## 1.3.0

### Minor Changes

- **LineChart x-axis: the first + last periods are never dropped, and crowded labels auto-rotate then thin to ~5.** LineChart now opts into the same adaptive axis machinery AreaChart already used (a data-period tick set + `autoRotate` + `maxTicks`), so a date axis always keeps its true first and last period - even when they are not the round calendar boundaries that raw `d3 scaleTime().ticks()` would otherwise snap to and drop - and dense labels tilt -45° then thin to ~5 (keeping both ends) instead of silently disappearing.

- **New opt-in `fillPeriodTicks` "continuous timeline" mode (LineChart + AreaChart).** Draws a tick for EVERY period across the range (every month/year), not just the periods present in the data. Periods with no value render faded (`.mv-tick-nodata`) and show a "no data" hover tooltip. Customize with `noDataTickTooltip(epochMs)` (tooltip text, plain string or sanitized HTML) and `noDataTickColor` (or the `--michi-vz-tick-nodata` CSS var). Exposed as `enumeratePeriods` / `periodValue` helpers and a `noDataValues` axis option internally; all five framework wrappers forward the new props.

## 1.2.1

### Patch Changes

- docs: add a Framework packages cross-link table to every package README and fix the dead monorepo link, so each npm page links to all the sibling wrappers. Also aligns vue/angular/svelte/wc to the same release as core/react.

## 1.2.0

### Minor Changes

- **thd drop-in compatibility release.** The additive API that lets the scoped `@michi-vz/*` packages replace the legacy single-package `michi-vz` with no chart regressions. Everything here is backward-compatible.

  **Renderer-agnostic context (`getContext()` / `onChartDataProcessed`)**

  - `legendData` (`LegendItem[]`: `label`, `color`, `order`, `disabled`, `dataLabelSafe`) on the Line/Gap/Area/Scatter/BarBell/Radar contexts - the per-series colour contract for skip-mode (canvas) consumers.
  - `renderedData` on the Gap context and `visibleItems` on the Line context (legacy `useGapChartMetadata` / `useLineChartMetadataExpose` parity).
  - Every `on*Processed` is now idempotent - it fires only when the serialized context actually changes (prevents render loops in consumers that dispatch on each call).

  **LineChart** - `isLoading` / `isNodata` (boolean or predicate) plus `noDataLabel` / `suppressDefaultOverlay`; axis config `yTicks`, `showGridLines`, `showVerticalGridLines`, `highlightZeroLine`; `fontFamily`; `svgChildren` (consumer-supplied SVG children, e.g. an axis-title `<text>`).

  **GapChart** - built-in shape legend (`showLegend`, `legendAlign`, `shapesLabelsMapping`); `enableExplicitTickValues`.

  **ComparableHorizontalBarChart** - `maxBarHeight` (cap bar thickness so a 1-2 row chart doesn't balloon; bands centre); `symmetricXDomain` (force `[-M, M]`, `M = max(|min|, |max|)`).

  **VerticalStackBarChart** - `xAxisLabelPadding` (rotate crowded labels −45° sooner); `keys` / `keysOrder`.

  **ScatterChart** - `xAxisDataType: "band"` scale path; crosshair overlay; draggable `dScaleLegend`; per-point shapes.

  **RadarChart** - accepts the legacy `data: [{ date, value }]` series shape + `poles.labels`; canvas forgiving hit-test.

  **Axes & rendering** - `renderXAxisLinear` adaptive `autoRotate` + `maxTicks`; band-axis `chooseAxisMode` (horizontal → −45° → thinned); y-band labels no longer clip and match the x-axis colour + font; the y-band gridline now respects `showGrid` (was always drawn); tooltips flip left near the host's right edge.

  **SEO & a11y** - the chart `<svg>` now carries `<title>`, `<desc>` (the deterministic summary) and `<metadata>` (schema.org `ImageObject` JSON-LD); a once-per-page console greeting (opt out via `globalThis.__MICHI_VZ_NO_GREETING__`).

  **CSS** (auto-injected by `ensureStyles()`) - `.mv-nodata` / `.mv-loading` overlays; new vars `--michi-vz-zero-line`, `--michi-vz-loading`, `--michi-vz-ink`, `--michi-vz-muted`, `--michi-vz-font-size`, `--michi-vz-font-family`.

  **New exports** - `buildLegendData`, `evaluateDataState`, `resolveIsNodata`, `resolveEffectiveProps`, `createHatchPattern`.

## 1.1.1

### Patch Changes

- Bar-Bell: render the end-cap circles on top of the bar segments (previously a later segment's bar could paint over the previous segment's cap), and make the whole segment hoverable for tooltips - the bar, not only the end-cap circle.

## 1.1.0

### Minor Changes

-
