# @michi-vz/core

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
