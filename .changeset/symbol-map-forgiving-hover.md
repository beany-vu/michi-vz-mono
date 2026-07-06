---
"@michi-vz/core": patch
---

SymbolMapChart: small/unlabeled circles now respond to hover in both the SVG
and canvas renderers. Root cause: the canvas/webgpu host-level hit-test
measured the pointer in host/full-SVG space but compared it against
plot-local mark coordinates, leaving every mark short by a constant
(margin.left, margin.top) offset — only marks whose radius exceeded that
offset's magnitude could ever be hit, regardless of pointer precision. Fixed
by converting the pointer to plot-local space before hit-testing. On top of
that, every mark now gets a forgiving effective hit radius of
`max(radius, 8px)`, with nearest-match-wins when a pointer qualifies for more
than one mark (e.g. a tiny dot next to a big bubble); the SVG renderer gets an
equivalent invisible, appropriately-sized hit target per mark. Large-bubble
hover behaviour is unchanged. No API changes.
