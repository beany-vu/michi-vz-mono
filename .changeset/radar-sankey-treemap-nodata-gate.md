---
"@michi-vz/core": patch
---

RadarChart, SankeyChart, and TreemapChart: the `isNodata` overlay no longer
draws alongside a fully-rendered chart underneath it. The chrome backfill
(`applyChartChrome`) stamped `data-mv-state="nodata"` and showed the overlay,
but each engine discarded the returned `DataState` and kept drawing the
grid/polygons (Radar), nodes/links (Sankey), and tiles/legend (Treemap) plus
their canvas/webgpu layers regardless - so a wrapped chart with a custom
`isNodataComponent` (or a consumer-forced `isNodata: true` with non-empty
data) showed the "no data" overlay on top of a chart that was still fully
drawn. Fixed by mirroring LineChart's `dataState !== "nodata"` gate around
every mark/axis/canvas draw call in all three engines; the title still
renders in the nodata state (as it already did), and context/a11y/warnings
are unaffected (they run regardless of DataState, same as every other
chart). No API changes.
