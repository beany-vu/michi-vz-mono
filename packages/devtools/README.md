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
| **Overview** | Live `ChartContext`, per-series stats (actual vs predicted), highlight/disable toggles, a dataSet JSON editor, and **Reset chart** to undo every panel edit |
| **Sizing** | The #1 chart bug everywhere: zero-size hosts, the clientWidth-includes-padding overflow trap, plus a ResizeObserver recipe |
| **Scales** | Axis domains with NaN / inverted / zero-width sanity checks |
| **Diff** | Deep diff between state snapshots (`series[0].max: 140 → 555`) with time-travel history |
| **Hit-test** | Live canvas pointer log + on-chart marker - a dead canvas listener shows as a silent log |
| **Profiler** | Per-update render durations with a trending-up warning |
| **Insights** | The chart's summary AI-styled + one-click Narrate / Detect anomalies / Forecast when `@michi-vz/insights` is attached. **No language model runs by default** - deterministic rules and statistics, nothing downloaded (each action's tooltip says exactly what it computes) |
| **A11y** | Chartability-inspired audit: missing summary, incomplete data table, duplicate series colors, sub-3:1 graphic contrast - plus the a11y table itself |

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

`@michi-vz/core` ships an opt-in page-level hook (`globalThis.__MICHI_VZ_DEVTOOLS_HOOK__`)
that every mounted chart registers with; the panel subscribes to it and also discovers
`<michi-vz-*>` web components in the DOM. When devtools is never enabled, charts pay a
single flag check per mount. Build your own UI (or a browser extension) against the same
hook - `enableDevtools` / `getDevtoolsHook` are re-exported here.

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

MIT © Hoang VU
