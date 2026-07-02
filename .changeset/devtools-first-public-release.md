---
"@michi-vz/devtools": minor
"@michi-vz/insights": minor
"@michi-vz/react": minor
---

First public release of @michi-vz/devtools: the in-page chart devtools panel (no browser extension needed).

- Panel now renders in its own Shadow DOM (style isolation; `getRoot()` on the handle) with light AND dark themes (auto via prefers-color-scheme, or an explicit `theme` option)
- New Sizing tab: host rect vs requested width/height, zero-size detection, the clientWidth-includes-padding overflow trap, and a ResizeObserver recipe
- New Scales tab: x/y axis domains with NaN / inverted / zero-width sanity checks
- New Diff tab: deep diff between ChartContext history snapshots (`diffObjects` exported)
- New Insights tab: the chart summary AI-styled, plus one-click Narrate / Detect anomalies (with flagged-series highlighting) / Forecast when @michi-vz/insights is attached; raw tool runner moved under Advanced
- New inert `@michi-vz/devtools/production` entry for prod-safe conditional imports

@michi-vz/insights: the narrate(), anomaly() and forecast() plugins now expose their capability as agent tools via provideTools (discoverable through chart.getTools(), powering the devtools Insights tab and any agent host).

@michi-vz/react: new `<MichiVzDevtools />` convenience component - renders nothing, mounts the panel while in the tree; dev-only by default (NODE_ENV-gated dynamic import, so production bundles drop the devtools chunk), `forceMount` opts a build in deliberately.
