---
"@michi-vz/core": minor
"@michi-vz/react": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
"@michi-vz/vue": minor
"@michi-vz/svelte": minor
"@michi-vz/examples": minor
---

New chart #22: GaugeChart - a concentric ring gauge (`mountGaugeChart` / `<GaugeChart>` / `<michi-vz-gauge-chart>`). One ring per dataSet item (outer to inner), each sweeping value/max of a full circle clockwise from `startAngle` over a background track; a null value renders the track only. Configurable ring thickness/gap, per-ring arc + track colours and opacities, rounded caps, `defaultActive` resting ring, hover activation with `onHighlightItem`, a built-in centre readout (`showCenterLabel` / `centerContent` / `valueFormatter` / `noValueLabel`), an opt-in `tooltipFormatter`, and svg / canvas / webgpu renderers sharing the standard colour-probe contract. Ships with ChartContext + legendData + a11y mirror, loading/no-data chrome, docs (4 locales), and examples.
