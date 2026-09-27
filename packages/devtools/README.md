# @michi-vz/devtools

In-page developer tools for [michi-vz](https://michi-vz.netlify.app/) charts - inspect,
diagnose, and drive every chart on the page. No browser extension: one import, versioned
with your app, rendered in its own Shadow DOM so styles never leak either way.

**[Documentation & live demo](https://michi-vz.netlify.app/guide/devtools)** - the panel
on that page is this real package running in your browser.

## Quick start

```bash
npm i -D @michi-vz/devtools
```

```ts
import { mountDevtools } from "@michi-vz/devtools";

// Call BEFORE mounting charts so they register themselves.
const devtools = mountDevtools();   // floating panel, toggle with Ctrl/Cmd+Shift+M

// later
devtools.destroy();
```

React one-liner (dev-only by default; production builds drop the chunk entirely):

```tsx
import { MichiVzDevtools } from "@michi-vz/react";

<MichiVzDevtools />
```

## What you get

| Tab | What it solves |
| --- | --- |
| **Overview** | Live `ChartContext`, a sortable **Items** table over the context's per-item array (series, jets, rings, nodes, regions, ...; hover a row to highlight it, without adding to History), highlight/disable toggles that keep disabled items listed, a JSON editor for whichever data prop the chart has (`dataSet`, `series`, `data`, or `nodes` + `links`), and **Reset chart** to undo every panel edit |
| **Props** | The `getProps()` tree (data collapsed to `Array(n)`, functions as `ƒ name`) - the options the context never echoes - plus a warning, naming the prop, when `highlightItems` or `disabledItems` changes more than 10 times a second in updates that change no other prop (the other props are compared in full, data included, so a resize, a slider or an animation that passes a new `dataSet` each frame is not churn; the warning clears after 30 quiet seconds) |
| **Sizing** | The #1 chart bug everywhere: zero-size hosts, the clientWidth-includes-padding overflow trap, plus a ResizeObserver recipe |
| **Scales** | Axis domains with NaN / inverted / zero-width sanity checks; radar, gauge, choropleth and symbol-map scales too |
| **Diff** | Deep diff between state snapshots with time-travel history; items matched by label/key/id/code (`series["Revenue"].max: 140 → 555`, a re-rank is one `reordered` entry) and prop-only changes under `props.` |
| **Hit-test** | Live canvas pointer log + on-chart marker for charts that report hits (a dead canvas listener shows as a silent log; charts without a hit channel say so), and an SVG inspector (element under the pointer + its colour key, read through a transparent hit target to the mark below it) for svg charts |
| **Profiler** | Per-update render durations with a trending-up warning |
| **Insights** | The chart's summary AI-styled + one-click Narrate / Detect anomalies / Forecast when `@michi-vz/insights` is attached. **No language model runs by default** - deterministic rules and statistics, nothing downloaded (each action's tooltip says exactly what it computes) |
| **A11y** | Chartability-inspired audit: missing summary, incomplete data table, duplicate series colors, sub-3:1 graphic contrast (once per color); a colour-ramp audit (adjacent steps, `noDataColor`) for choropleth, symbol map and `colorScale` charts - plus the a11y table itself |

Also: resizable (drag the top-left corner; remembered per browser) and maximizable, a
filter box + locate button for many-chart pages, renderer badges (svg / canvas / webgpu),
light + dark themes.

## Production safety

Gate the mount behind `process.env.NODE_ENV !== "production"` (the React component does
this for you), or import the inert no-op entry:

```ts
import { mountDevtools } from "@michi-vz/devtools/production"; // does nothing, same API
```

## How it works

`@michi-vz/core` ships an opt-in page-level hook (`globalThis.__MICHI_VZ_DEVTOOLS_HOOK__`) that
every mounted chart registers with; the panel subscribes to it and also discovers `<michi-vz-*>` web
components in the DOM (it finds each chart host by its `.michi-vz` class and climbs to the enclosing
element, which keeps the id it was first given, one no other chart has had). A chart's history and
other panel state are freed when it is destroyed or leaves the page. A listener that throws is
reported with `console.error` and never breaks the app's `chart.update()`. When devtools is never
enabled, charts pay a single flag check per mount. Build your own UI (or a browser extension)
against the same hook - `enableDevtools` / `getDevtoolsHook` are re-exported here.

## Framework packages

| Package | For |
| --- | --- |
| [@michi-vz/core](https://www.npmjs.com/package/@michi-vz/core) | Vanilla TS engine |
| [@michi-vz/react](https://www.npmjs.com/package/@michi-vz/react) | React |
| [@michi-vz/vue](https://www.npmjs.com/package/@michi-vz/vue) | Vue 3 |
| [@michi-vz/svelte](https://www.npmjs.com/package/@michi-vz/svelte) | Svelte |
| [@michi-vz/angular](https://www.npmjs.com/package/@michi-vz/angular) | Angular |
| [@michi-vz/wc](https://www.npmjs.com/package/@michi-vz/wc) | Web components |
| [@michi-vz/insights](https://www.npmjs.com/package/@michi-vz/insights) | Forecast, anomaly, narration, agent/MCP |
| **@michi-vz/devtools** | This package |

## For AI assistants

The whole library is documented in one machine-readable file: [llms-full.txt](https://michi-vz.netlify.app/llms-full.txt) (compact index: [llms.txt](https://michi-vz.netlify.app/llms.txt)). Point a coding agent at it for correct props, usage per framework, and the ChartContext shape.

MIT © Hoang VU
