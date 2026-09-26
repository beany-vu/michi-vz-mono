---
"@michi-vz/core": minor
"@michi-vz/wc": minor
---

AreaChart `stacked: false`: overlapping areas for series that don't add up (shares, rates, indices). Every key runs from zero to its own value, as a translucent fill with a line in the series colour along its top edge, in the svg, canvas and webgpu renderers. The y axis runs to the largest single value, larger areas draw first so smaller ones stay visible, and hover picks the series whose top edge is nearest the pointer. `stackOffset: "expand"` is ignored with it and reported as an `ignored-option` data warning. The default stays `true`. The web component takes it as a property, and `@michi-vz/angular` forwards it.
