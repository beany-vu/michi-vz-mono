---
"@michi-vz/core": patch
---

FountainChart (experimental): symmetry now carries meaning, so `lean` is a real flag.

- An explicit `lean: 0` stands the jet truly upright (before, it was coerced into the
  decorative drift and an upright jet was impossible). A signed `lean` bends the crown
  toward the heavier side; an item with NO `lean` keeps the gentle decorative wind drift.
- `getContext().jets[]` now carries `lean`: the clamped signed value when the item encodes
  one, or `null` when the drift is purely decorative - so consumers can tell flag from
  flourish. Applies to SVG, canvas, and WebGPU alike (shared render model).
