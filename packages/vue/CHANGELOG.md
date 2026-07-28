# @michi-vz/vue

## 1.7.1

### Patch Changes

- Updated dependencies [17abc81]
  - @michi-vz/core@1.14.0

## 1.7.0

### Minor Changes

- 486978e: New chart #22: GaugeChart - a concentric ring gauge (`mountGaugeChart` / `<GaugeChart>` / `<michi-vz-gauge-chart>`). One ring per dataSet item (outer to inner), each sweeping value/max of a full circle clockwise from `startAngle` over a background track; a null value renders the track only. Configurable ring thickness/gap, per-ring arc + track colours and opacities, rounded caps, `defaultActive` resting ring, hover activation with `onHighlightItem`, a built-in centre readout (`showCenterLabel` / `centerContent` / `valueFormatter` / `noValueLabel`), an opt-in `tooltipFormatter`, and svg / canvas / webgpu renderers sharing the standard colour-probe contract. Ships with ChartContext + legendData + a11y mirror, loading/no-data chrome, docs (4 locales), and examples.

### Patch Changes

- Updated dependencies [486978e]
- Updated dependencies [486978e]
  - @michi-vz/core@1.13.0

## 1.6.6

### Patch Changes

- Updated dependencies [3dab6e7]
  - @michi-vz/core@1.12.2

## 1.6.5

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.12.1

## 1.6.4

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.12.0

## 1.6.3

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.11.1

## 1.6.2

### Patch Changes

- Updated dependencies [9c0d6ae]
- Updated dependencies [a6e7db1]
  - @michi-vz/core@1.11.0

## 1.6.1

### Patch Changes

- Updated dependencies [bfd75d7]
- Updated dependencies [04dfb80]
- Updated dependencies [04dfb80]
  - @michi-vz/core@1.10.0

## 1.6.0

### Minor Changes

- d489c39: SymbolMapChart `positionMode: "force" | "precise"` (default `"force"`, the legacy parity behaviour). `"precise"` skips the one-shot de-overlap simulation entirely: every symbol stays at its exact projected lng/lat and overlapping circles are allowed. Use it whenever the audience will read exact geographic position off the chart - the force simulation drifts symbols from their true coordinates (a cartographic-accuracy problem, and on small plots the drift can be large), which matters especially when a `geography` backdrop landmass is visible. WC attribute `position-mode`; forwarded by every wrapper.
- 2d94944: Credit the real new API these packages shipped alongside `@michi-vz/core`'s
  ComparableVerticalBarChart/ChoroplethMapChart/SymbolMapChart/RadialTreeChart
  additions (charts #18-21), which had previously only bumped these two packages
  as a dependency-only patch: Vue gains the `ComparableVerticalBarChart`,
  `ChoroplethMapChart`, `SymbolMapChart`, and `RadialTreeChart` components;
  Svelte gains the `comparableVerticalBarChart`, `choroplethMapChart`,
  `symbolMapChart`, and `radialTreeChart` actions.

### Patch Changes

- Updated dependencies [849fcf0]
- Updated dependencies [2303099]
- Updated dependencies [88d5d8f]
- Updated dependencies [9386db8]
- Updated dependencies [1d1a000]
- Updated dependencies [69f6b96]
- Updated dependencies [d489c39]
  - @michi-vz/core@1.9.0

## 1.5.9

### Patch Changes

- Updated dependencies [e62ad08]
- Updated dependencies [57a9150]
- Updated dependencies [17be1b0]
- Updated dependencies [f109971]
  - @michi-vz/core@1.8.0

## 1.5.8

### Patch Changes

- Updated dependencies [3c0bc4b]
- Updated dependencies [d920094]
- Updated dependencies [d920094]
- Updated dependencies [d920094]
- Updated dependencies [2b68160]
  - @michi-vz/core@1.7.0

## 1.5.7

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

- LineChart hover crosshair is ON by default again (legacy `michi-vz` parity), snaps to the nearest data point x, hides on mouseleave, and `enableMouseLine` now also accepts a `MouseLineConfig` object (`{ stroke, strokeWidth, strokeDasharray, snap }`). Flows through automatically (options object passes straight to the core engine).

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
