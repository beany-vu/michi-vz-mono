---
"@michi-vz/core": patch
---

Scatter, bar-bell and area legends keep disabled labels flagged in their original slot (the VSB 1.5.6 / ComparableBar 1.12.2 contract): the scatter engine now threads the pre-disable dataSet into `buildScatterContext` (visible-or-disabled labels only, so rank/date-filtered items are not resurrected), and bar-bell/area context builders take a pre-disable `legendKeys` list. Scatter's context also gains a per-label `series` summary (`label`/`code`/`last`) built from the pre-disable rows, so consumers can rank legends by newest value even for disabled labels. `contextSignature` folds `series` through the bounded hash so a 50k-point scatter signature stays a few hundred bytes. Ribbon still derives its legend from post-disable keys (no `disabledItems` threading yet) — known follow-up.
