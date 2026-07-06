---
"@michi-vz/core": patch
---

ChoroplethMapChart: fixed a latent margin-offset bug in the canvas/webgpu
host-level hover/hit-test (same bug class as SymbolMapChart's B3.7 fix).
`onHostMove` measured the pointer in host/full-SVG space but compared it
against a projection built from margin-excluded plot space, with no
(margin.left, margin.top) subtraction — every region polygon was offset by a
constant margin vector, so hover/tooltip hit-testing was wrong whenever
`margin` differed from a small/zero default. Fixed by converting the pointer
to plot-local space before running the point-in-polygon test. No forgiveness
radius is added (regions are area targets, not point targets), and the SVG
renderer is unaffected (its `<path>` elements already carry native mouse
listeners). No API changes.
