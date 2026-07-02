# What's new

The latest `@michi-vz` releases, newest first. All six packages -
[core](https://www.npmjs.com/package/@michi-vz/core),
[wc](https://www.npmjs.com/package/@michi-vz/wc),
[react](https://www.npmjs.com/package/@michi-vz/react),
[vue](https://www.npmjs.com/package/@michi-vz/vue),
[svelte](https://www.npmjs.com/package/@michi-vz/svelte),
[angular](https://www.npmjs.com/package/@michi-vz/angular) - version together
(each release lists any package that moved ahead). Full per-commit detail lives in the
[GitHub releases](https://github.com/beany-vu/michi-vz-mono/releases).

## v1.6.0

Package versions: react **1.6.0** · devtools **0.2.0** · insights **0.2.0** · core, wc, vue,
svelte, angular **1.5.2**.

- **DevTools 0.2.0: the Michi shield toggle button.** Mounting the devtools no longer covers
  your app - it starts as a small floating shield (the library's crest). Click it, or press
  `Ctrl/Cmd+Shift+M`, to open the panel; the open/closed state is remembered per browser, so a
  reload comes back exactly how you left it. Corner taken by another floating widget? **Drag
  the shield anywhere** - that spot is remembered too, and the new `buttonPosition` option
  picks the starting corner. The handle gained `isOpen()`, and `<MichiVzDevtools />` (react
  1.6.0) passes `buttonPosition` through. See [DevTools](/guide/devtools).
- **Insights 0.2.0: `matchLabels()` cross-dataset linkage.** Link the same entities across two
  differently-spelled lists (a CRM export vs an ERP export) so two datasets become one joined
  chart: mutual best match by default, confidence-margin gated, unmatched rows returned with a
  "did you mean" hint. Model-free hashing works offline; the MiniLM backend also links
  synonyms, abbreviations, and translations. Try the live
  [MatchLab](/guide/insights#clean-match-and-search-your-data) demo.
- **Core 1.5.2: heavy-page performance fixes.** The `onChartDataProcessed` idempotency guard
  now signs contexts through a bounded FNV-1a hash instead of stringifying every row (a
  multi-MB string per render at 50k points), and canvas/WebGPU scatter hover collapses each
  frame's pointer burst into one trailing `requestAnimationFrame` pass. Big dashboards stay
  responsive with nothing to configure.
- **Docs:** the Michi shield is now the site favicon and sits beside the navbar title; every
  page ships a unique description and social card.

## v1.5.0

- **DevTools is here: `@michi-vz/devtools` 0.1.0, first public release.** An in-page panel
  (no browser extension) that inspects every chart's live state across eight tabs -
  Overview (with live editing + **Reset chart**), Sizing, Scales, Diff, Hit-test, Profiler,
  Insights, and an A11y audit. Shadow-DOM isolated, resizable,
  light + dark, dev-only by default with an inert `/production` entry, and a React
  one-liner: `<MichiVzDevtools />`. See [DevTools](/guide/devtools).
- **Insights 0.1.0: transparent and local-first AI.**
  [Methodology](/guide/insights#methodology---the-exact-logic-behind-every-insight) now
  spells out the exact logic behind every insight; `describeModelSource()` states what a
  model backend would download and from where **before** anything loads; `modelSource`
  redirects downloads to a mirror or self-hosted files (or forbids them entirely); and
  `ollamaCaller` / `openaiCompatCaller` hook a local AI (Ollama, LM Studio, llama.cpp)
  in one line with zero downloads. Anomaly results now carry their method, threshold,
  and a plain-language explanation.
- **Core:** the devtools hook gained high-frequency hit-test and render-timing channels
  (zero cost when devtools is off).

## v1.4.0

- **The hover crosshair is back - and configurable.** LineChart's vertical mouse line is on by default again (legacy parity; the port had silently flipped it off), snaps to the nearest data point instead of trailing the raw cursor, and hides when the cursor leaves the chart - in SVG, canvas, and WebGPU modes alike. Style it per chart with `enableMouseLine: { stroke, strokeWidth, strokeDasharray, snap }`, theme it globally with the `--michi-vz-crosshair` / `--michi-vz-crosshair-width` / `--michi-vz-crosshair-dash` CSS vars, or pass `false` to turn it off.

## v1.3.0

- **No period left behind on the x-axis.** LineChart date axes now always keep the true first and last period (raw `d3` time ticks used to snap to round boundaries and drop them), and crowded labels auto-rotate -45° then thin to ~5 instead of silently disappearing.
- **Continuous timelines with `fillPeriodTicks` (Line + Area, opt-in).** A tick for every period in the range, not just the ones present in the data; missing periods render faded with a "no data" hover tooltip, customizable via `noDataTickTooltip` and `noDataTickColor`.

## v1.2.1

- **Every npm page links its siblings.** Each package README now carries a *Framework packages* table linking all six packages, so from any wrapper you can reach the rest. A dead monorepo link was fixed.
- **All six packages realigned.** `vue`, `angular`, `svelte`, and `wc` were a version behind on npm; they are now published together with `core` and `react` at the same version.
- **Docs discoverability.** The [Installation](/guide/installation) table links each package to npm, and there is an npm button on the home page plus an npm icon in the top navigation.

## v1.2.0

The **drop-in compatibility** release: the scoped `@michi-vz/*` packages can replace the legacy single-package `michi-vz` with no chart regressions. Everything is backward-compatible.

- **Renderer-agnostic context.** `legendData` (the per-series colour contract for canvas / skip-mode consumers) on the Line/Gap/Area/Scatter/BarBell/Radar contexts; `renderedData` / `visibleItems`; every `on*Processed` is now idempotent, so it fires only when the context actually changes and never loops.
- **LineChart.** Loading / no-data states, axis config (`yTicks`, grid lines, zero-line highlight), `fontFamily`, and consumer-supplied `svgChildren`.
- **More chart props.** Gap shape legend; Comparable `maxBarHeight` / `symmetricXDomain`; VerticalStackBar label rotation + `keys`; Scatter band scale, crosshair, and per-point shapes; Radar legacy data shape + forgiving hit-test.
- **Axes, SEO, and a11y.** Adaptive auto-rotate and tick-thinning on crowded axes; the chart `<svg>` now carries `<title>`, `<desc>`, and schema.org JSON-LD `<metadata>`.
- **Experimental WebGPU** render path alongside SVG and canvas.

## v1.1.1

- **Bar-Bell fix.** End-cap circles render on top of the bar segments (previously a later segment could paint over the previous segment's cap), and the whole segment is hoverable for tooltips, not only the end-cap circle.
