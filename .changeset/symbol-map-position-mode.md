---
"@michi-vz/core": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
"@michi-vz/vue": minor
"@michi-vz/svelte": minor
---

SymbolMapChart `positionMode: "force" | "precise"` (default `"force"`, the legacy parity behaviour). `"precise"` skips the one-shot de-overlap simulation entirely: every symbol stays at its exact projected lng/lat and overlapping circles are allowed. Use it whenever the audience will read exact geographic position off the chart - the force simulation drifts symbols from their true coordinates (a cartographic-accuracy problem, and on small plots the drift can be large), which matters especially when a `geography` backdrop landmass is visible. WC attribute `position-mode`; forwarded by every wrapper.
