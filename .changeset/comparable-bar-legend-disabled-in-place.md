---
"@michi-vz/core": patch
---

ComparableHorizontalBar + ComparableVerticalBar: keep disabled labels in `legendData`, flagged `disabled: true` and in their original slot (the VerticalStackBar 1.5.6 contract). Previously a disabled label was dropped from the emitted legend entirely, so consumer legends re-appended it elsewhere — a visible resort (and possible recolour) on every legend-pill click. Bars still exclude disabled labels; `legendLabels` is threaded through `buildComparableBarContext` / `buildComparableVerticalBarContext` and defaults to the visible points' labels.
