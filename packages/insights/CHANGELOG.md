# @michi-vz/insights

## 0.2.14

### Patch Changes

- Updated dependencies [3dab6e7]
  - @michi-vz/core@1.12.2

## 0.2.13

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.12.1

## 0.2.12

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.12.0

## 0.2.11

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.11.1

## 0.2.10

### Patch Changes

- Updated dependencies [9c0d6ae]
- Updated dependencies [a6e7db1]
  - @michi-vz/core@1.11.0

## 0.2.9

### Patch Changes

- Updated dependencies [bfd75d7]
- Updated dependencies [04dfb80]
- Updated dependencies [04dfb80]
  - @michi-vz/core@1.10.0

## 0.2.8

### Patch Changes

- Updated dependencies [849fcf0]
- Updated dependencies [2303099]
- Updated dependencies [88d5d8f]
- Updated dependencies [9386db8]
- Updated dependencies [1d1a000]
- Updated dependencies [69f6b96]
- Updated dependencies [d489c39]
  - @michi-vz/core@1.9.0

## 0.2.7

### Patch Changes

- Updated dependencies [e62ad08]
- Updated dependencies [57a9150]
- Updated dependencies [17be1b0]
- Updated dependencies [f109971]
  - @michi-vz/core@1.8.0

## 0.2.6

### Patch Changes

- Updated dependencies [3c0bc4b]
- Updated dependencies [d920094]
- Updated dependencies [d920094]
- Updated dependencies [d920094]
- Updated dependencies [2b68160]
  - @michi-vz/core@1.7.0

## 0.2.5

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

- Updated dependencies [322ea0c]
- Updated dependencies [e063c94]
- Updated dependencies [680b89a]
  - @michi-vz/core@1.6.0

## 0.2.4

### Patch Changes

- Updated dependencies [55e21f9]
  - @michi-vz/core@1.5.6

## 0.2.3

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.5

## 0.2.2

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.4

## 0.2.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.3

## 0.2.0

### Minor Changes

- 6d42c8c: New `matchLabels(source, target, options)` in `@michi-vz/insights/embeddings`: link the same entities ACROSS two differently-spelled lists (a CRM export vs an ERP export), so two datasets can become one joined chart. Where `reconcileLabels` cleans duplicates within one list, `matchLabels` pairs the lists: a pair is a confident match only when it clears the similarity threshold, the same confidence-margin gate `reconcileLabels` uses (on the source's choice among targets), and - by default - a MUTUAL best match, so two source rows never silently collide onto one target (duplicates resolve to one winner, the rest reported back). Returns `{ matches, unmatchedSource, unmatchedTarget }`; the unmatched carry their closest near-miss as a "did you mean" hint, never dropped or force-fitted. Model-free hash default links spelling/case/typo variants offline; `{ backend: "transformers" }` (MiniLM) also links synonyms, abbreviations, and translations; `mutual: false` opts into many-to-one. Docs: a live MatchLab demo ("two sources, one chart") plus a recipe feeding matches straight into `mountComparableHorizontalBarChart`.

### Patch Changes

- Updated dependencies [18b92b4]
  - @michi-vz/core@1.5.2

## 0.1.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.5.1

## 0.1.0

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

## 0.0.3

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.2.1

## 0.0.2

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.1.1

## 0.0.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.1.0
