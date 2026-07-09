---
"@michi-vz/core": minor
"@michi-vz/wc": minor
"@michi-vz/react": minor
"@michi-vz/angular": minor
---

Play-through-years `timeline` on all 21 charts, reveal animation on every chart, and an animation-resume fix.

- New opt-in `timeline` prop (off by default) with a built-in play button + year scrubber and a headless controller (`chart.timeline()`, wc `getTimeline()`, React handle `timeline()`). Semantics per chart family: time-axis charts (Line, Area, Range, Fan, VerticalStackBar, Ribbon, Fountain trend mode) draw their marks up to the active year and sweep between years; snapshot charts (Gap, Scatter, Pie, Bubble, both Comparable bars, Dual, ChoroplethMap, SymbolMap) show one period's rows at a time with values tweening between periods; Treemap and RadialTree snapshot via `date`-tagged root nodes with the whole hierarchy tweening; Sankey via `date`-tagged links; Radar and BarBell via a new `period` row field (their `date` already means something else). LineChart's timeline supports `tipLabel` riding the growing line.
- New opt-in `progressiveDraw` prop: LineChart draws itself left to right with optional tip labels following each line's end; the other charts get a clip-based reveal wipe. `replay()` re-runs it (core instance, wc element, React handle). `timeline` wins when both are set.
- Both features work in `svg` and `canvas` render modes, respect `prefers-reduced-motion` (instant, no animation), never alter `getContext()`/a11y output, and are inert on the experimental `webgpu` renderer (full frame paints instantly).
- Fix: a re-render during a running animation now resumes it from its current position instead of jumping to the end. Framework wrappers call `update()` immediately after mount, which previously cancelled every mount autoplay.
- New `date?` fields on TreemapNode, RadialTreeNode, SankeyLinkItem and `period?` on RadarDataItem, BarBellDataRow; `MountOptions` gains optional `ticker`/`motion` injection for deterministic animation tests. No API removed or renamed.
