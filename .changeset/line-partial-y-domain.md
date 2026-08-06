---
"@michi-vz/core": minor
"@michi-vz/wc": patch
---

LineChart `yAxisDomain` accepts partial bounds: either entry may be `null` to keep that bound data-derived. `[0, null]` pins the baseline at 0 while the maximum keeps following the visible series (rescaling with legend toggles and Top/Bottom-N slices, exactly like the fully-derived domain). A derived bound is clamped so it never crosses a pinned one.
