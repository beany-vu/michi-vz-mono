---
title: DevTools - inspect, drive, and edit any chart
---

# See inside your charts

A chart draws pixels, but the interesting part is the **state behind them**: the series, the
stats, the plain-language summary an AI reads, and which points are *observed* versus *forecast*.
`@michi-vz/devtools` is an opt-in, in-page panel that surfaces all of it for **every** michi-vz
chart on the page, lets you **drive** them (highlight, disable, run agent tools), and even **edit
the data** and watch the chart re-render. No browser extension to install.

<DevtoolsDemo />

> Click **Open devtools panel** (or press `Ctrl/Cmd+Shift+M`). Pick the chart in the list to see
> its `ChartContext`, the actual-vs-predicted split, and controls. Edit the `dataSet` box and
> hit **Apply** to re-render. It is the real package, running in your browser.

## Why not a browser extension?

You do not need one. Every michi-vz chart is **Light DOM** and already exposes its state
(`getContext()`, `getTools()`), so an in-page panel reads everything directly. That makes the
devtools:

- **Zero-install** - it is just an `import`, versioned with your app.
- **Testable before you ship** - it runs in jsdom/Playwright like any other module.
- **Framework-agnostic** - it discovers imperative `mountXChart()` instances *and* `<michi-vz-*>`
  web components alike.

A real browser extension is only worth it later, to inspect michi-vz on pages that do **not** bundle
the devtools module. It would reuse the same hook, so nothing here is throwaway.

## Time travel through state

The panel snapshots each chart's `ChartContext` on **every update** and keeps a short history. When a
chart has changed more than once, a **History** bar appears: step `◀` / `▶` through past snapshots to
see exactly how the state evolved, or click **● live** to return to the latest. While you are viewing a
past snapshot the controls are read-only (you are inspecting history, not driving the chart). This is
the fastest way to answer "what did this chart look like one update ago, and what changed?"

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

`mountDevtools(options?)` returns a handle: `{ open, close, toggle, refresh, destroy }`.

| Option      | Default            | Notes                                                        |
| ----------- | ------------------ | ----------------------------------------------------------- |
| `container` | `document.body`    | Where the panel is attached.                                 |
| `open`      | `true`             | Start open or collapsed to a toggle button.                  |
| `hotkey`    | `Ctrl/Cmd+Shift+M` | Set `null` to disable the keyboard toggle.                   |

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
