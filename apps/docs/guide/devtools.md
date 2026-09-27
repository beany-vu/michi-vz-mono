---
title: DevTools - inspect, drive, and edit any chart
---

# See inside your charts

A chart draws pixels, but the bugs live in the **state behind them**: the data that actually
reached the engine, the axis domains, the host box the chart was measured against, and which
points are *observed* versus *forecast*. `@michi-vz/devtools` is an opt-in, in-page panel that
surfaces all of it for **every** michi-vz chart on the page. No browser extension to install:
it is one import, versioned with your app.

<DevtoolsDemo />

> Click **Mount devtools**: the floating Michi shield appears bottom right - the devtools'
> collapsed face. Click it (or press `Ctrl/Cmd+Shift+M`) to open the panel, pick the chart in the
> list, and walk the tabs: **Overview** (context, items table, live editing), **Props**,
> **Sizing**, **Scales**, **Diff**, **Hit-test**, **Profiler**, **A11y**, and **Insights** - where
> ✦ **Narrate** and ✦ **Detect anomalies** run real `@michi-vz/insights` plugins against the live
> chart (the 2022 Cost spike gets flagged; highlight it from the result). This is the real
> package, running in your browser.

## Quick start

```bash
npm i -D @michi-vz/devtools
```

```ts
import { mountDevtools } from "@michi-vz/devtools";

// Call this BEFORE mounting charts so they register themselves.
// The floating Michi shield button appears; click it (or Ctrl/Cmd+Shift+M) to open the panel.
const devtools = mountDevtools();

import { mountLineChart } from "@michi-vz/core";
mountLineChart(host, { dataSet, xAxisDataType: "number" });

// later
devtools.destroy();
```

Using React? There is a one-liner that mounts the devtools while it is in the tree and renders
nothing (dev-only by default - production builds drop the devtools chunk entirely):

```tsx
import { MichiVzDevtools } from "@michi-vz/react";

<MichiVzDevtools />
```

Charts rendered in the same tree register with the panel even when they mount in the same render
as `<MichiVzDevtools />`: the component switches the hook on in a layout effect, before the
charts' own mount effects run.

For Vue, Svelte, Angular, or plain web components the recipe is the same three lines: call
`mountDevtools()` in your root component's mount hook, `destroy()` on unmount. And for builds
where devtools must stay inert without changing the import site, the
`@michi-vz/devtools/production` entry exports a no-op `mountDevtools`.

## The floating button

Mounting the devtools never covers your app: it starts as the small **Michi shield** (the
library's crest) in a corner.
Click it to open the panel, close the panel to get the button back, and the open/closed state
is **remembered per browser** - reload the page and the devtools comes back exactly how you
left it. Sharing a corner with a chat widget or another devtools button? **Drag the shield
anywhere** - that spot is remembered too. `buttonPosition` picks the starting corner.

`mountDevtools(options?)` returns a handle:
`{ open, close, toggle, isOpen, refresh, getRoot, destroy }`.

| Option           | Default            | Notes                                                                    |
| ---------------- | ------------------ | ------------------------------------------------------------------------ |
| `container`      | `document.body`    | Where the panel's shadow host is attached.                               |
| `open`           | remembered         | Force `true`/`false`; default restores the last state, closed first run. |
| `hotkey`         | `Ctrl/Cmd+Shift+M` | Set `null` to disable the keyboard toggle.                               |
| `theme`          | `"auto"`           | `"auto"` follows `prefers-color-scheme`; or force `"dark"` / `"light"`.  |
| `buttonPosition` | `"bottom-right"`   | Starting corner for the button; a dragged spot wins on later mounts.     |

The panel renders inside its own **Shadow DOM**, so its styles cannot leak into your app (and
your app's CSS cannot break the panel). The charts themselves stay light DOM - the panel never
touches the color contract.

Working with a big context or a long series table? **Drag the panel's top-left corner** to
resize it (the size is remembered per browser), or hit the **⛶** button in the header to
maximize it to the full viewport and back.

Dashboards with many charts stay manageable: the chart list has a **filter box**, every list entry
has a **◎ locate** button that scrolls the chart into view and flashes an outline around it, and
past 8 charts the panel coalesces update bursts into a single re-render so a busy page never lags
because devtools is open. The panel does no polling at all - it only reacts to the hook's events,
and history snapshots skip charts whose context and props have not changed.

## The tabs

### Sizing - "why is my chart invisible / overflowing?"

The single most common chart bug in any library is a sizing bug: a host measured at `0×0`
inside a hidden tab, or a chart sized from `clientWidth` without subtracting padding (yes,
`clientWidth` **includes** padding) so it overflows its card. The Sizing tab shows the host's
rendered rect, client box, and padding next to the width/height the chart was asked for, flags
the mismatch in plain language, and includes a copy-paste `ResizeObserver` recipe - because
michi-vz charts are fixed-size by design and responsiveness belongs to the host.

### Scales - "why are my axis values wrong?"

Renders the live `xAxis` / `yAxis` domains straight from the `ChartContext`, with sanity checks
for the three classic failure modes: a `NaN` domain (a date or value failed to parse), a
zero-width domain (every value identical, marks collapse), and an inverted domain (a manual domain
prop passed backwards). Charts without x/y axes that still map values through a scale show that
scale instead: the radar's radial domain `[0, maxValue]`, the gauge's sweep `[min, max]`, the
choropleth's lowest and highest matched value, and the symbol map's `colorScale` thresholds (or
its value range when it has no `colorScale`). Pie, sankey and treemap place marks without a value
scale, and say so.

### Diff - "what changed between these two renders?"

The panel snapshots each chart's `ChartContext` on **every update** and keeps a short history. The
Diff tab deep-diffs the last two snapshots into an added/removed/changed list with exact paths, so
"my chart looks different and I do not know why" becomes a two-line answer. Array items are
matched by their `label`, `key`, `id` or `code`, so a path names the item
(`series["Revenue"].max: 140 → 555`) and a Top-N re-rank shows as one **reordered** entry instead
of a wall of index changes (the same goes for a list such as `renderedRankedIds`). Each snapshot
also keeps a data-free copy of the props, so an update that changes only props (a highlight, a
`barRadius` tweak) is a snapshot too and shows under `props.` (`props.highlightItems`). Step back
through the History bar and the diff follows the snapshot you are viewing.

### Insights - the chart explains itself

Every michi-vz chart already carries a plain-language `summary` in its context - the same text
an AI agent or screen-reader pipeline consumes. The Insights tab shows it in an AI-styled bubble,
and when [`@michi-vz/insights`](/guide/insights) is attached to the chart it lights up one-click
actions discovered through `getTools()`:

- ✦ **Narrate** - `chart.use(narrate())` - deterministic prose narration of the current state.
- ✦ **Detect anomalies** - `chart.use(anomaly())` - flags outliers per series; the result offers
  a one-click **highlight** of the flagged series on the live chart.
- ✦ **Forecast** - `chart.use(forecast())` - the projected points, accuracy, and any threshold
  crossing.

Anything else a plugin exposes shows under **Advanced** as a raw tool runner (JSON args in,
JSON result out).

### Hit-test - "why doesn't my tooltip fire?"

Canvas marks have no DOM, so when a hover stops working there is nothing to inspect in the Elements
panel - you cannot tell a hit-test bug from a dead listener from a CSS `pointer-events` problem. For
the charts that report their canvas hit-tests (bubble, fountain, line, radial tree, scatter, symbol
map and treemap), the Hit-test tab streams them live: every pointer move logs its coordinates and
the mark it resolved (or a miss), and a green/red marker tracks the last event on the chart itself.
The killer diagnostic is silence: if you are hovering and the log is not moving, the chart's canvas
listener is dead. The other charts do not report canvas hits yet, and the tab says exactly that
instead of blaming the listener.

For a chart drawn as SVG, the tab is an **SVG inspector**: move the pointer over the chart and it
logs the topmost element under it (tag, class, position among its siblings) and a **colour key**,
read from the nearest `data-label-safe` / `data-label` ancestor of the first element under the
pointer that has one. A transparent hit target carries no key, so over a symbol map's mark the row
reads `circle.symbol-hit over circle.symbol` and shows the key of the mark below. The colour key is
the hook the colour contract uses, not the mark's identity: a sankey link, for example, carries the
key of its source or target node. Layers with `pointer-events: none`, such as gauge annotations, are
invisible to it.

### Profiler - "why did this get slow?"

Every `update()` is timed at the engine boundary. The Profiler tab shows the last/mean/max
render durations with a per-update bar strip, and warns when render time is trending up -
the usual suspects being growing data, non-memoized props forcing full re-renders, or leaked
listeners.

### A11y - the audit no chart devtool does

Chartability-inspired heuristics run against the live context: a missing plain-language `summary`
(screen readers and AI agents get nothing), an a11y table with fewer rows than series, two series
sharing one color (indistinguishable without vision), and colors below the 3:1 graphics-contrast
ratio on a light or dark background, checked once per color and naming every series that uses it.
Choropleth and symbol maps, and any chart with a `colorScale`, color by bins, so places in the
same bin share a color on purpose. There the tab audits the ramp instead: neighbouring steps that
are hard to tell apart, and a `noDataColor` that matches or nearly matches a step. Below the
audit, the tab renders the actual a11y data table - exactly what a screen reader gets.

### Props - "which switches is this chart running with?"

Many options never show up in the `ChartContext`: `barRadius`, an area chart's `stacked` /
`stackOffset`, the sankey's `hoverHighlight`, a gauge's sweep, zoom, and the timeline and reveal
configs. The Props tab shows what `getProps()` returns, as a tree: the data props (`dataSet`,
`series`, `nodes`, `links`, ...) collapse to `Array(n)` and functions show as `ƒ` and their name.

Props are part of History too, so an update that changes only props (a highlight, a styling switch)
is a snapshot the Diff tab can show. When `highlightItems` or `disabledItems` changes more than 10
times in one second, each time in an update that changes no other prop, the tab warns and names the
prop: that is usually an app echoing `onHighlightItem` back into `highlightItems` on every hover.
Let the chart handle hover itself (for example the sankey's `hoverHighlight`) and keep
`highlightItems` for selections. The other props are compared in full, data included, so resizing a
responsive chart, dragging a slider bound to `barRadius`, or a timeline that passes a new `dataSet`
on every frame while it highlights the current leader never warns. Data changed in place and passed
again as the same array counts as a change only when its length changes. Functions compare by name,
so the fresh callbacks a React render passes do not hide an echo. The warning clears after 30
seconds without such changes.

Edits made from the panel go straight to the chart instance. On a chart managed by React or a web
component, the wrapper's next render passes its own props again and overwrites them.

### Overview - inspect, drive, edit

The classic inspector: the summary, the stats, and an **Items** table built from the context's
per-item array - `series`, a fountain's `jets`, a gauge's `rings`, sankey `nodes`, treemap `leaves`,
map `regions` or `symbols`, and so on, with a dropdown when there is more than one. Click a column
to sort it (a fountain's jets by range, for example) and hover a row to highlight that item on the
chart. The hover is not recorded in History, and leaving the table puts back the highlight the app
had set. Series with a forecast show the actual-vs-predicted split described below. The
highlight/disable toggles list every label the chart knows about (legend, colors, the current
highlight and disable props), so a series you disable stays in the list. The JSON editor edits
whichever data prop the chart has (`dataSet`, `series`, `data`, or a sankey's `nodes` and `links`
together) - edit, hit **Apply**, and watch the chart re-render. Played too much? **Reset chart**
restores the data, highlight, and disable state to exactly what they were when devtools first saw
the chart - every panel-driven edit undone in one click.

By the way: the ✦ actions on the Insights tab are **not a language model** by default - they
run the chart's insights plugins locally (deterministic rules and statistics; each action's
tooltip says exactly what it computes). Nothing is downloaded, nothing leaves the page.

## Time travel through state

When a chart has changed more than once, a **History** bar appears: step `◀` / `▶` through past
snapshots to see exactly how the state evolved, or click **● live** to return to the latest.
Snapshots also catch the renders a chart starts on its own: a timeline step, the end of a timeline
tween, a line chart zoom, a bubble chart's async layout, the switch to WebGPU, and a plugin added
with `use()`. While viewing a past snapshot the controls are read-only (you are inspecting history,
not driving the chart). Combined with the Diff tab, this answers "what did this chart look like one
update ago, and what changed?" in seconds. When a chart is destroyed or leaves the page, the panel
drops that chart's history and everything else it kept for it.

## Actual vs predicted

The panel makes a chart's **provenance** explicit. Mark forecast points with `predicted: true` on
the data point (it is back-compatible: when omitted, it derives from `certainty === false`, the same
flag that draws a segment dashed):

```ts
const dataSet = [{
  label: "Revenue",
  series: [
    { date: 2022, value: 104, certainty: true },                    // observed
    { date: 2023, value: 121, certainty: false, predicted: true },  // forecast
  ],
}];
```

That flows into every chart's `ChartContext` as `actualCount`, `predictedCount`, and `forecastStart`
(per series on Line, Fan, and Range), so the panel - and any AI agent reading the context - can tell
the past from the projection without guessing at dashes.

The stacked **Area** chart shares one x per date, so there `predicted` is set on the whole **row**
and surfaces at the chart level as `stats.actualRows`, `stats.predictedRows`, and `stats.forecastStart`:

```ts
const series = [
  { date: 2022, cloud: 60, onprem: 44 },                  // observed
  { date: 2023, cloud: 78, onprem: 40, predicted: true }, // forecast row
];
```

> [!TIP] Prefer `predicted` over `certainty` to mark a forecast.
> `certainty` also goes `false` for auto-detected data **gaps** (`detectGaps`), so it cannot tell a
> forecast apart from a hole in the data. `predicted` is unambiguous.

**Coverage.** Provenance is a time-series idea, so it is carried by the charts where a forecast is
natural: **Line**, **Fan**, and **Range** (per series), and **Area** (per row). The categorical,
part-to-whole, and relational charts (stacked bar, bar-bell, comparable, dual, gap, pie/donut, bubble,
sankey, treemap, radar, scatter) have no forecast axis, so they do not carry a `predicted` flag.

## Why not a browser extension?

You do not need one. Every michi-vz chart is **Light DOM** and already exposes its state
(`getContext()`, `getTools()`), so an in-page panel reads everything directly. That makes the
devtools:

- **Zero-install** - it is just an `import`, versioned with your app.
- **Testable before you ship** - it runs in jsdom/Playwright like any other module.
- **Framework-agnostic** - it discovers imperative `mountXChart()` instances *and* `<michi-vz-*>`
  web components alike.
- **Prod-safe** - gate it behind `process.env.NODE_ENV !== "production"` (the React component does
  this for you) or import `@michi-vz/devtools/production`; either way your users never download it.

A real browser extension is only worth it later, to inspect michi-vz on pages that do **not** bundle
the devtools module. It would reuse the same hook, so nothing here is throwaway.

## How it works

`@michi-vz/core` ships a tiny opt-in hook. `mountDevtools()` calls `enableDevtools()`, which
installs `globalThis.__MICHI_VZ_DEVTOOLS_HOOK__` - a registry every `mountXChart()` writes to on
mount and clears on `destroy()`. The panel subscribes to it for updates. To find web components that
mounted before the devtools, it also sweeps the DOM for chart hosts (the `.michi-vz` class) and
climbs to the enclosing `<michi-vz-*>` element, skipping any the hook already lists. Each element
keeps the id it was first given: its own `id` attribute the first time the panel meets that id,
otherwise a numbered id no other chart has had. No two charts share an id, and removing one chart
never hands its history or controls to another. A hook listener that throws is reported with
`console.error` and never breaks your `chart.update()`. When devtools is never enabled, the hook is
never created and charts pay only a single flag check per mount.

You can build your own UI (or a future extension) against the same surface:

```ts
import { getDevtoolsHook, enableDevtools } from "@michi-vz/core";

enableDevtools();
const hook = getDevtoolsHook();           // { charts: Map, subscribe, ... }
hook?.subscribe((charts) => {
  for (const c of charts) console.log(c.chartType, c.getContext());
});
```

Each chart entry also says whether its engine reports canvas hits (`hitReporting: "canvas"` or
`"none"`), which is how the Hit-test tab knows when silence means a dead listener.
