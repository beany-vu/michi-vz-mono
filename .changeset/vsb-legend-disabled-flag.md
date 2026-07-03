---
"@michi-vz/core": patch
---

VerticalStackBarChart: keep disabled keys in legendData flagged `disabled: true` (legend pill dims instead of disappearing, matching LineChart's contract); colour slots are assigned over the full key set so no key changes colour across a disable/enable toggle. Bars still exclude disabled keys.
