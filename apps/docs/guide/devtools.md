---
title: DevTools - inspect, drive, and edit any chart
---

# See inside your charts

A chart draws pixels, but the bugs live in the **state behind them**: the data that actually
reached the engine, the axis domains, the host box the chart was measured against, and which
points are *observed* versus *forecast*. `@michi-vz/devtools` is an opt-in, in-page panel that
surfaces all of it for **every** michi-vz chart on the page - and no other chart library ships
anything like it. No browser extension to install: it is one import, versioned with your app.

<DevtoolsDemo />

> Click **Open devtools panel** (or press `Ctrl/Cmd+Shift+M`), pick the chart in the list, and
> walk the tabs: **Overview** (context, series, live editing), **Sizing**, **Scales**, **Diff**,
> **Hit-test**, **Profiler**, **A11y**, and **Insights** - where ✦ **Narrate** and ✦ **Detect
> anomalies** run real `@michi-vz/insights` plugins against the live chart (the 2022 Cost spike
> gets flagged; highlight it from the result). This is the real package, running in your browser.

## Quick start

```bash
npm i -D @michi-vz/devtools
```

```ts
import { mountDevtools } from "@michi-vz/devtools";

// Call this BEFORE mounting charts so they register themselves.
const devtools = mountDevtools();      // floating panel, toggle with Ctrl/Cmd+Shift+M

import { mountLineChart } from "@michi-vz/core";
mountLineChart(host, { dataSet, xAxisDataType: "number" });

// later
devtools.destroy();
```

Using React? There is a one-liner that mounts the panel while it is in the tree and renders
nothing (dev-only by default - production builds drop the devtools chunk entirely):

```tsx
import { MichiVzDevtools } from "@michi-vz/react";

<MichiVzDevtools />
```

For Vue, Svelte, Angular, or plain web components the recipe is the same three lines: call
`mountDevtools()` in your root component's mount hook, `destroy()` on unmount. And for builds
where devtools must stay inert without changing the import site, the
`@michi-vz/devtools/production` entry exports a no-op `mountDevtools`.

`mountDevtools(options?)` returns a handle: `{ open, close, toggle, refresh, getRoot, destroy }`.

| Option      | Default            | Notes                                                                   |
| ----------- | ------------------ | ----------------------------------------------------------------------- |
| `container` | `document.body`    | Where the panel's shadow host is attached.                              |
| `open`      | `true`             | Start open or collapsed to a toggle button.                             |
| `hotkey`    | `Ctrl/Cmd+Shift+M` | Set `null` to disable the keyboard toggle.                              |
| `theme`     | `"auto"`           | `"auto"` follows `prefers-color-scheme`; or force `"dark"` / `"light"`. |

The panel renders inside its own **Shadow DOM**, so its styles cannot leak into your app (and
your app's CSS cannot break the panel). The charts themselves stay light DOM - the panel never
touches the color contract.

Working with a big context or a long series table? **Drag the panel's top-left corner** to
resize it (the size is remembered per browser), or hit the **⛶** button in the header to
maximize it to the full viewport and back.

Dashboards with many charts stay manageable: the chart list has a **filter box**, every list
entry has a **◎ locate** button that scrolls the chart into view and flashes an outline around
it, and past 8 charts the panel coalesces update bursts into a single re-render so a busy page
never lags because devtools is open. The panel does no polling at all - it only reacts to the
hook's events, and history snapshots skip charts whose context has not changed.

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
zero-width domain (every value identical, marks collapse), and an inverted domain (a manual
domain prop passed backwards). Charts without axes (pie, sankey, treemap) say so instead of
showing nothing.

### Diff - "what changed between these two renders?"

The panel snapshots each chart's `ChartContext` on **every update** and keeps a short history.
The Diff tab deep-diffs the last two snapshots into an added/removed/changed list with exact
paths (`series[0].max: 140 → 555`), so "my chart looks different and I do not know why" becomes
a two-line answer. Step back through the History bar and the diff follows the snapshot you are
viewing.

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

Canvas marks have no DOM, so when a hover stops working there is nothing to inspect in the
Elements panel - you cannot tell a hit-test bug from a dead listener from a CSS
`pointer-events` problem. The Hit-test tab streams the chart's own canvas hit-test results
live: every pointer move logs its coordinates and the mark it resolved (or a miss), and a
green/red marker tracks the last event on the chart itself. The killer diagnostic is silence:
if you are hovering and the log is not moving, the chart's canvas listener is dead.

### Profiler - "why did this get slow?"

Every `update()` is timed at the engine boundary. The Profiler tab shows the last/mean/max
render durations with a per-update bar strip, and warns when render time is trending up -
the usual suspects being growing data, non-memoized props forcing full re-renders, or leaked
listeners.

### A11y - the audit no chart devtool does

Chartability-inspired heuristics run against the live context: a missing plain-language
`summary` (screen readers and AI agents get nothing), an a11y table with fewer rows than
series, two series sharing one color (indistinguishable without vision), and series colors
below the 3:1 graphics-contrast ratio on a light or dark background. Below the audit, the tab
renders the actual a11y data table - exactly what a screen reader gets.

### Overview - inspect, drive, edit

The classic inspector: the summary, per-series stats (including the actual-vs-predicted split
below), highlight/disable toggles that patch the live props, and a `dataSet` JSON editor -
edit, hit **Apply**, and watch the chart re-render.

## Time travel through state

When a chart has changed more than once, a **History** bar appears: step `◀` / `▶` through past
`ChartContext` snapshots to see exactly how the state evolved, or click **● live** to return to
the latest. While viewing a past snapshot the controls are read-only (you are inspecting history,
not driving the chart). Combined with the Diff tab, this answers "what did this chart look like
one update ago, and what changed?" in seconds.

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

`@michi-vz/core` ships a tiny opt-in hook. `mountDevtools()` calls `enableDevtools()`, which installs
`globalThis.__MICHI_VZ_DEVTOOLS_HOOK__` - a registry every `mountXChart()` writes to on mount and
clears on `destroy()`. The panel subscribes to it for updates and also sweeps the DOM for
`<michi-vz-*>` elements that mounted earlier. When devtools is never enabled, the hook is never
created and charts pay only a single flag check per mount.

You can build your own UI (or a future extension) against the same surface:

```ts
import { getDevtoolsHook, enableDevtools } from "@michi-vz/core";

enableDevtools();
const hook = getDevtoolsHook();           // { charts: Map, subscribe, ... }
hook?.subscribe((charts) => {
  for (const c of charts) console.log(c.chartType, c.getContext());
});
```
