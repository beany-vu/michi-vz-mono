---
"@michi-vz/core": patch
---

SymbolMapChart: bubbles can no longer clip at the plot edges. The
projected-extent rescale now insets its target range by the maximum bubble
radius, and the de-overlap simulation clamps every node to
`[r, width - r] x [r, height - r]` per tick — large bubbles whose data sits at
the extent (e.g. a max-value point at the far west) render fully inside the
canvas. No API changes.
