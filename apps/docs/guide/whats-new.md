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

## v1.11.8

Package versions: core **1.19.0** · wc, angular **1.12.7** · react **1.11.8** · vue, svelte **1.7.8** ·
examples **1.1.8** · devtools, insights **0.2.23**.

- **Multi-line size-legend title on the [scatter plot](/charts/scatter)**: `dScaleLegend.title`
  also accepts an array of strings, rendered as stacked lines above the size arcs: long
  translated titles wrap instead of spilling past the chart's right edge.

## v1.11.7

Package versions: core **1.18.0** · wc, angular **1.12.6** · react **1.11.7** · vue, svelte **1.7.7** ·
examples **1.1.7** · devtools, insights **0.2.22**.

- **No more empty-state axes**: charts skip axes and marks while loading with nothing to
  draw yet, and the [Gap Chart](/charts/gap) and [scatter plot](/charts/scatter) now honor
  `isLoading`/`isNodata` (overlays + `data-mv-state`) instead of drawing a collapsed,
  centered axis on empty data. A refetch with data still on screen keeps its axes. New
  core exports: `isEmptyDataSet`, `shouldSkipScaffold`.

## v1.11.6

Package versions: core **1.17.0** · wc, angular **1.12.5** · react **1.11.6** · vue, svelte **1.7.6** ·
examples **1.1.6** · devtools, insights **0.2.21**.

- **Partial `yAxisDomain` on the [Line Chart](/charts/line)**: either bound may now be
  `null` to keep just that bound data-derived. `[0, null]` pins the baseline at 0 while
  the maximum keeps following the visible series - it still rescales with legend toggles
  and Top/Bottom-N slices, exactly like the fully-derived domain. A derived bound is
  clamped so it never crosses a pinned one (all-negative data under `[0, null]` yields
  `[0, 0]` instead of a reversed axis). A plain `[min, max]` of numbers behaves as before.

## v1.11.5

Package versions: core **1.16.2** · wc, angular **1.12.4** · react **1.11.5** · vue, svelte **1.7.5** ·
examples **1.1.5** · devtools, insights **0.2.20**.

- **Disabled legend items keep their slot** on the [scatter plot](/charts/scatter),
  [bar-bell](/charts/bar-bell) and [area chart](/charts/area). Their legends previously
  derived from the disabled-filtered data, so a clicked (disabled) label vanished from
  `legendData` and consumer fallbacks re-appended it at the end of the legend. All three
  now keep the label flagged `disabled: true` in its original slot, the same contract the
  stacked bar (core 1.5.6) and comparable bar (core 1.12.2) legends follow. The scatter
  context also gains a per-label `series` summary (`label`/`code`/`last`) built from
  the pre-disable rows, so a hidden label keeps its newest value for consumer-side legend
  ranking.
- **`contextSignature` stays bounded with the new `series` field**: it is folded through
  the same hash as rows and legend instead of serialized, so a 50k-point scatter signature
  stays a few hundred bytes.

## v1.11.4

Package versions: core **1.16.1** · wc, angular **1.12.3** · react **1.11.4** · vue, svelte **1.7.4** ·
examples **1.1.4** · devtools, insights **0.2.19**.

- **Top/Bottom ranking skips series with no data at the anchor date.** On the
  [Line Chart](/charts/line), a series with no finite value at the `filter.date`
  anchor now ranks LAST in **both** sort directions. The old sentinel only sorted
  it last under `desc` — under `asc` (Bottom-N) it sorted *first*, so Bottom-N
  filled its slots with the series that had no data at the anchor year instead of
  the lowest real values. A row present at the anchor holding a `null`/`NaN`
  value counts as missing too.
- **Date-axis ticks can no longer outrun the drawn lines.** The Line Chart's
  period tick candidates (and the `fillPeriodTicks` "present" set) are now
  sourced from the same ranked/sliced/`disabledItems`-filtered set the x-domain
  uses. Previously a ranked-out pool series holding a later period than any
  drawn series painted a tick past the plot edge, leaving an empty axis stretch
  after the last line.

## v1.11.3

Package versions: core **1.16.0** · wc, angular **1.12.2** · react **1.11.3** · vue, svelte **1.7.3** ·
examples **1.1.3** · devtools, insights **0.2.18**.

- **Hiding a ranked series no longer backfills.** On the [Line Chart](/charts/line),
  [Comparable Horizontal Bar](/charts/comparable) and
  [Comparable Vertical Bar](/charts/comparable-vertical-bar), the Top/Bottom `filter`
  now ranks and slices the FULL set *before* `disabledItems` are removed — so hiding
  one of the top N via the legend draws N−1 series instead of letting the (N+1)-th
  item slide into the freed slot (the order the [Gap Chart](/charts/gap) and the
  stacked-bar group slice always used). While a `filter` is active, `legendData`
  keeps the hidden ranked series as a greyed row and `renderedRankedIds` still lists
  its code, so a consumer selection UI mirroring the rendered set stays stable
  across show/hide toggles. Without a `filter`, nothing changes.

## v1.11.2

Package versions: core **1.15.0** · wc, angular **1.12.1** · react **1.11.2** · vue, svelte **1.7.2** ·
examples **1.1.2** · devtools, insights **0.2.17**.

- **The context now says what's actually on screen.** New `renderedRankedIds` on the
  shared ChartContext: the codes of the series actually drawn, in rendered order
  (after `disabledItems` and the Top/Bottom `filter` sort+slice), emitted by the
  [Line Chart](/charts/line), [Vertical Stack Bar](/charts/vertical-stack-bar),
  [Comparable Horizontal Bar](/charts/comparable),
  [Comparable Vertical Bar](/charts/comparable-vertical-bar), and
  [Gap Chart](/charts/gap) builders. Per-series `code` is also surfaced on the stack
  and comparable-bar contexts, and numeric codes are no longer dropped by the stack
  chart. Lets a consumer selection UI follow a ranked chart (the "Top-N chips"
  pattern).

## v1.11.1

Package versions: core **1.14.0** · wc, angular **1.12.0** · react **1.11.1** · vue, svelte **1.7.1** ·
examples **1.1.1** · devtools, insights **0.2.16**.

- **[Vertical stack bar](/charts/vertical-stack-bar) goes sideways.** New additive
  `layout: "horizontal"`: rows on a band y-axis (the shared ellipsizing HTML labels,
  so long category names stay readable) with stacked segments growing rightward from
  x(0). Data, colour-slot, legend, tooltip, hit-test, and missing-marker contracts are
  identical to the vertical layout, and the `xAxis*` props keep formatting the category
  axis (`yAxis*`/`yTicks` the value axis) in both orientations - flipping layout is one
  prop. Series-abbreviation labels, `xAxisMode`, and `timeline` remain vertical-only.

## v1.11.0

Package versions: react, wc, angular **1.11.0** · core **1.13.0** · vue, svelte **1.7.0** ·
examples **1.1.0** · devtools, insights **0.2.15**.

- **New chart: [Gauge (Rings)](/charts/gauge).** A concentric ring gauge - one ring per
  item, outer to inner, each sweeping `value/max` of a full circle over a background
  track. Hover activates a ring and drives the built-in centre readout; a `null` value
  renders the track only. Ring thickness/gap, per-ring colours and opacities, start
  angle, rounded caps, and the centre content are all configurable, with svg, canvas,
  and webgpu renderers sharing the standard colour-probe contract.
- **[Line chart](/charts/line) drag-to-zoom.** Opt in with the `zoom` prop: drag a
  horizontal range inside the plot to zoom the x-domain (a selection rectangle previews
  it), with a built-in "Reset zoom" chip, `minRange`, an `onZoomChange` callback, and
  `resetZoom()` / `setZoomDomain()` for programmatic control. Marks clip to the plot
  box; ticks, crosshair snapping, and tooltips follow the zoomed domain.
- **PNG exports can carry a title and a source line.** `chartToPngDataUrl` accepts
  `title` and `caption` text blocks (word-wrapped, alignment/size/colour configurable)
  composited above and below the chart.

## v1.10.4

Package versions: react, wc, angular **1.10.4** · core **1.12.2** · vue, svelte **1.6.6** ·
devtools, insights **0.2.14**.

- **Comparable-bar legends no longer reshuffle when you disable an item.** On the
  [Comparable horizontal bar](/charts/comparable) and
  [Comparable vertical bar](/charts/comparable-vertical-bar) charts, a label listed in
  `disabledItems` used to disappear from the emitted `legendData` entirely, so legends
  built from it re-appended the item elsewhere - a visible resort (and possible recolour)
  on every legend click. A disabled label now stays in `legendData`, flagged
  `disabled: true`, in its original slot; the bars themselves still drop it. This matches
  the contract the vertical stack bar chart has had since core 1.5.6.

## v1.10.3

Package versions: react, wc, angular **1.10.3** · core **1.12.1** · vue, svelte **1.6.5** ·
devtools, insights **0.2.13**.

- **No more stray "Chart" tooltip.** Every chart used to inject an svg `<title>` with a
  `"Chart"` fallback for SEO, and browsers render a root-level svg `<title>` as a native
  hover tooltip - so hovering anywhere over any chart popped a little "Chart" label. The
  element is now injected only when you set a `title` prop; crawlers keep the JSON-LD
  metadata, and screen readers were never affected (the svg is `aria-hidden`, the hidden
  a11y table remains their representation).
- **[Line chart](/charts/line) tooltips know their series again.** The point handed to
  `tooltipFormatter` carries its series `label` once more (`{ ...point, label }`), as in
  the pre-monorepo library. Tooltips that print the series name from `point.label` had
  been rendering that row empty since the migration.

## v1.10.2

Package versions: react, wc, angular **1.10.2** · core **1.12.0** · vue, svelte **1.6.4** ·
devtools, insights **0.2.12**.

- **A crowded date axis now tilts its labels instead of dropping most of them.** Every
  band-axis chart ([Vertical stack bar](/charts/vertical-stack-bar),
  [Comparable vertical bar](/charts/comparable-vertical-bar),
  [Fountain](/charts/fountain), [Ribbon](/charts/ribbon), [Scatter](/charts/scatter))
  used to give up on rotation once bands got narrow and lay a thinned set of labels flat.
  A tilted label only needs its diagonal clearance, roughly a quarter of what a flat one
  needs, so it now rotates a thinned subset and keeps about three times more labels. It
  only rotates when that actually buys labels, so an axis that gains nothing stays flat.
  `xAxisMode: "horizontal"` still forces flat labels.
- **Fixed: thinned tick labels could be drawn on top of each other.** The thinner
  guaranteed how MANY labels to keep but never how far apart, so it could pick two
  neighbouring bands. Overlap is now measured exactly - each pair's own label widths when
  flat, the perpendicular gap when tilted - and colliding labels are dropped. The first
  and last labels are always kept, so the axis still shows its full range.
- **`YYYYMM` categories step by calendar.** A monthly axis lands on real anchors (every
  January, Jan/Jul, Jan/Apr/Jul/Oct) instead of wherever base-10 rounding fell. That
  rounding was also the cause of the overlap above: it is meaningless over a base-12
  month field, so it put two ticks either side of every year boundary. Four-digit years
  are unchanged, since round decades already suit them.

## v1.10.1

Package versions: react, wc, angular **1.10.1** · core **1.11.1** · vue, svelte **1.6.3** ·
devtools, insights **0.2.11**.

- **Fixed:** on [Vertical stack bar](/charts/vertical-stack-bar), the x-axis date labels no
  longer land on top of the series abbreviations. When a DataSet supplies
  `seriesKeyAbbreviation` - the short letter drawn under each group column - the tick
  labels now start below that row instead of sharing it. It showed as overlapping text
  whenever a crowded axis tilted its labels -45°, monthly `MM-YYYY` dates especially. The
  chart reserves the matching extra bottom margin too, so the tilted labels still fit.
  Charts whose DataSets carry no abbreviation render exactly as before.

## v1.10.0

Package versions: react, wc, angular **1.10.0** · core **1.11.0** · vue, svelte **1.6.2** ·
devtools, insights **0.2.10**.

- **Play through the years, on every chart.** The new opt-in `timeline` prop adds
  a built-in play button + year scrubber (and a headless `chart.timeline()`
  controller) to all 21 charts. Time-axis charts like [Line](/charts/line) and
  [Area](/charts/area) draw their marks up to the active year and sweep smoothly
  as the years play; snapshot charts like [Pie](/charts/pie), [Gap](/charts/gap),
  and [Scatter](/charts/scatter) step through one period's data at a time with
  values gliding between years; [Treemap](/charts/treemap) and
  [Radial Tree](/charts/radial-tree) tween whole hierarchies from `date`-tagged
  root nodes; [Sankey](/charts/sankey) plays over `date`-tagged links; and
  [Radar](/charts/radar) and [Bar-Bell](/charts/bar-bell) use a new `period` row
  field. Off by default everywhere, and every chart page now has a live demo.
- **Reveal animation on every chart.** The opt-in `progressiveDraw` prop wipes
  the marks in from left to right on mount - and on [Line](/charts/line), labels
  ride each growing line's end and settle beside it. `replay()` re-runs the
  reveal on demand.
- Both features work in `svg` and `canvas` render modes, respect
  `prefers-reduced-motion` (the chart renders fully drawn instantly), and are
  intentionally inert on the experimental `webgpu` renderer.
- **Fixed:** a re-render during a running animation now resumes it from its
  current position instead of jumping to the end - framework wrappers update the
  chart right after mounting, which previously cancelled every mount autoplay.
- **Fixed:** the bare CDN URL for the web component bundle
  (`cdn.jsdelivr.net/npm/@michi-vz/wc`) now resolves to the self-contained
  browser bundle, so a plain `<script type="module">` import works without
  spelling out the full `/dist/...` path.

## v1.9.0

Package versions: react **1.9.0** · core **1.10.0** · wc, angular **1.9.1** · vue, svelte **1.6.1** ·
devtools, insights **0.2.9**.

- **Download any chart as an image or CSV.** New core export helpers:
  `chartContextToCsv(ctx)` turns any chart's `getContext().a11yTable` (the full,
  untruncated data table every chart carries) into RFC-4180 CSV with no per-chart
  code, and `chartToStyledSvgString` / `chartToStyledSvgDataUri` /
  `chartToPngDataUrl` rebuild a standalone, correctly styled SVG or PNG. Exported
  images used to lose gridlines, axis labels and the zero line because the chart
  CSS lives in `adoptedStyleSheets`, invisible to a plain serializer; the PNG
  helper also composites canvas-renderer marks over the SVG axes. React chart
  handles gain `getElement()` so the helpers get a scoped element instead of a
  fragile global DOM query.
- **One tooltip, every series.** LineChart's `sharedTooltip` (plus an optional
  `sharedTooltipFormatter`) shows a single tooltip listing every series' value at
  the nearest year alongside the crosshair, instead of only the nearest series.
  Forwarded by the web component and Angular wrappers. See [Line](/charts/line).
- **The a11y table now carries the data itself.** LineChart's `a11yTable` became
  a wide per-period table - one column per x value labelled like the axis, one
  row per series, `-` for gaps - so a CSV export off `getContext()` includes
  every plotted point. Per-series stats stay on `context.series`; this is the
  release's only behaviour change.
- **Gap chart axis parity.** [Gap](/charts/gap) gains `showZeroLineForXAxis` (a
  solid vertical line at x=0, now drawn independently of `showGrid`) and
  `maxBarHeight` (a 1-2 row chart no longer stretches its bars across the full
  plot height), and the numeric value axes on Gap and
  [Comparable](/charts/comparable) tilt crowded ticks -45° before thinning, as
  the date axes already did.
- **Label fixes across the band charts.** Row labels clamp to two lines with an
  ellipsis instead of overlapping their neighbours; long category labels rotate
  instead of being wrongly thinned to half the axis; a [Bubble](/charts/bubble)
  label hugging the right edge flips to the left of its point rather than being
  cropped; and [Comparable Vertical Bar](/charts/comparable-vertical-bar) paints
  the shorter sub-bar on top - a row whose "before" value was smaller used to
  hide it completely behind the taller bar - with the change arrow now centred
  above each pair.

## v1.8.1

Package versions: react **1.8.1** · core, wc, angular **1.9.0** · vue, svelte **1.6.0** ·
devtools, insights **0.2.8**.

- **Four new charts - the atlas grows to 21.** [Comparable Vertical Bar](/charts/comparable-vertical-bar)
  (two full-width overlapping columns per category, hatched "before" behind a solid "after",
  with a change arrow above each pair), and the library's first geography family:
  [Choropleth Map](/charts/choropleth-map) (bring your own GeoJSON, 13 projections, threshold
  or categorical colouring), [Symbol Map](/charts/symbol-map) (lng/lat bubbles with an optional
  muted landmass backdrop), and [Radial Tree](/charts/radial-tree) (a radial dendrogram with
  circles sized at both the group and leaf level).
- **Log axes on LineChart.** `yAxisScale: "log"` for data spanning decades: non-positive
  values step aside as missing (with a data warning) and crowded labels thin to powers of
  ten. See [Line](/charts/line).
- **True 100% stacking on AreaChart.** `stackOffset: "expand"` turns any stacked area into
  shares of the whole - real d3 stacking, not a display-only rescale. See [Area](/charts/area).
- **Comparable bars, two new tools.** `layout: "grouped"` splits each band into side-by-side
  halves instead of overlaying, and `deltaIndicator` draws a red/green change arrow per row.
  See [Comparable](/charts/comparable).
- **Honest symbol positions.** Symbol Map's `positionMode: "precise"` keeps every bubble at
  its exact projected lng/lat (overlaps allowed) instead of the default de-overlap simulation -
  the right choice whenever a visible landmass invites reading positions literally. A live
  toggle on the [Symbol Map page](/charts/symbol-map) shows the difference.
- **Labels where they were missing.** Scatter gains `pointLabels` plus a `drawOrder` choice
  (small-on-top default, or the legacy large-on-top); Treemap can print each tile's value
  with `tileValueLabels`. The loading and no-data overlays now also cover Radar, Sankey, and
  Treemap - and marks correctly stand down while an overlay shows.

## v1.6.5

Package versions: react **1.6.5** · core, wc, angular **1.6.0** · vue, svelte **1.5.7** ·
devtools, insights **0.2.5**.

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
