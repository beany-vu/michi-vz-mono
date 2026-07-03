# @michi-vz/react

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
