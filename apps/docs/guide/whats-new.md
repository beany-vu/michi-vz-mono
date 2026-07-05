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

## Coming in the next release <span class="vp-badge warning">On main, unreleased</span>

Already merged and live in these docs' demos; ships to npm with the next version wave.

- **RibbonChart finally trades places.** Each period's stack is now re-ranked by value, so
  a category that overtakes another visibly crosses ribbons on its way up - the whole point
  of a ribbon chart, restored from the legacy library. See it on the
  [Ribbon page](/charts/ribbon): US music revenue, where streaming overtakes everything and
  vinyl climbs back past the CD.
- **Comparable bars you can actually read.** The shorter sub-bar draws on top again (a grown
  bar no longer hides its "before"), and the new `colorsBasedMapping` gives the before-bar
  its own colour - pair an opaque light tint with `valueBasedOpacity: 1` for a crisp
  pale-vs-solid read in light and dark. See [Comparable](/charts/comparable).
- **Bubble clusters without the freeze.** `layoutMode: "async"` runs the same deterministic
  force settle in ~12ms slices behind the chart's loading overlay - a 3,000-bubble cluster
  that used to block the page for ~20 seconds now costs at most a 50ms frame. `settleTicks`
  tunes the settle, unchanged inputs skip the simulation entirely, and the layout is
  memoised across re-renders. See the collision-event demo on [Bubble](/charts/bubble).
- **Small controls, big comfort.** BarBell's value axis can move below the plot
  (`xAxisPosition: "bottom"`), GapChart accepts an explicit `xAxisDomain` (zoom a
  life-expectancy story into its 35-90 band), the tornado's row labels can sit left of the
  plot (`yAxisPosition: "left"`), Radar pole labels stay clear of the title, and the
  tornado's context summary now names its largest imbalance.
- **Row labels you can grab - and scrub.** On Gap, Comparable, and the tornado, opt-in
  `interactiveRowLabels` makes every row label a real control: hover or focus it and a
  leader line runs to its row with the tooltip and highlight; click pins. The label gutter
  also scrubs like a slider - drag along it and the tooltip tracks your cursor from row to
  row, reaching even rows whose labels were thinned away on a dense axis. Try it on the
  demos above each of those pages.
- **A legend for everything.** Every chart context now carries `legendData`, and split
  charts (treemap, bubble, comparable) also expose each label's pale companion via
  `LegendItem.paleColor` - the docs demos use it for their colour legends and the
  "Meaning | Colour pairs" toggle.
- **Dense band axes thin themselves.** Row labels on gap/comparable/dual/bar-bell (and the
  fountain snapshot axis) sample to a readable subset instead of smearing at 100+ rows.
- **Docs: press the buttons.** Every chart page now has live "✦ Explain this chart" (the
  real insights rules engine, in your browser) and "🛠 Try DevTools on this chart" actions,
  plus new story-driven examples: the LHC dimuon spectrum on
  [Scatter](/charts/scatter), EU gross-vs-net salaries on [Bubble](/charts/bubble), and
  a ~195-country life-expectancy sweep on [Gap](/charts/gap).
- **The Fountain learns to explain itself.** The [Fountain page](/charts/fountain) now opens
  with an anatomy glossary (every visible part of the glyph has one stated meaning) and a
  field guide of eleven live reads - certainty, stability, risk, AI confidence, divided
  audiences, Philippine typhoons and more, most in the clean symmetric plume look. Symmetry now carries meaning
  too: an explicit `lean: 0` stands a jet truly upright, a signed `lean` flags one-sided
  risk, and a jet with no `lean` keeps its decorative Geneva wind (reported as `lean: null`
  in `getContext()`).

## v1.6.1 - v1.6.4

Package versions: react **1.6.4** · devtools, insights **0.2.4** · core, wc, vue, svelte,
angular **1.5.6**. Four small patch waves between the headline releases:

- **GapChart's value axis, hardened three ways.** Consumer-supplied `tickValues` are
  filtered to finite values, sorted, and de-duplicated (degenerate inputs fall back to the
  data domain); marks and axis no longer overflow when `tickValues` are passed while
  `enableExplicitTickValues` is off; and percentage domains gain range-aware padding, so a
  baseline marker at zero sits on the axis instead of past its edge.
- **VerticalStackBar's legend keeps its colours.** A key you disable stays in `legendData`
  flagged `disabled: true`, so the legend pill dims instead of disappearing, and colour
  slots are assigned over the full key set - no key changes colour across a disable/enable
  toggle. Bars still exclude disabled keys.

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
- **Docs, now in four languages.** The site speaks English, French, Dutch, and Vietnamese,
  with a language switcher in the navbar - every guide, chart, and API page is translated.
  Contributions to the translations are welcome; see the footer's **Help translate** link.
- **A sharper home page.** The homepage now leads with the DevTools story and four
  plain-language pillars - inspect everything, charts machines can read, accessible by default,
  and runs locally. A new footer invites you to star the repo, join the community, contribute,
  and help translate. The Michi shield is the site favicon and sits beside the navbar title,
  and every page ships a unique description and social card.

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
