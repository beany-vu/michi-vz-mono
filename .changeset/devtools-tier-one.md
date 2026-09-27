---
"@michi-vz/devtools": minor
"@michi-vz/core": minor
"@michi-vz/react": patch
---

Devtools: `<MichiVzDevtools />` now registers charts that mount in the same React commit (the panel showed 0 charts with the documented setup). The panel finds `<michi-vz-*>` web components on the page and gives each a stable id; Refresh records a History snapshot; Diff matches rows by key, so a re-ranked list no longer shows as a wall of changes; Scales covers radar, gauge and colour-scaled maps; the A11y colour check is ramp-aware. New Items table and Highlight/Disable controls built from each chart's context (area, VSB, fountain and others had none), and Disable keeps the series in the list. New Props tab, with prop-only changes in History and Diff and a warning when highlightItems or disabledItems echo more than 10 times a second. Hovering an Items row no longer fills History. The Hit-test tab gains an SVG inspector and says plainly when a chart does not report canvas hits. Per-chart panel state is freed when a chart is destroyed. Core: a devtools listener that throws no longer throws from `chart.update()`, timeline steps and other engine-started renders notify the panel, and `attachDevtools` takes a `hitReporting` option.
