---
"@michi-vz/core": patch
---

Fixes label overprint on `LineChart` `yAxisScale: "log"` when the y-domain spans more
than ~2 decades: previously every d3 log tick (1, 2, 3…9, 10, 20, 30…) got a text
label, which smeared into unreadable overlapping text on wide-range data (e.g. values
from 0.0007 to 446, ~7 decades after `.nice()`). The y-axis now labels only the powers
of 10 within the domain on wide log axes, while minor ticks still draw their
(unlabeled) gridlines - matching d3's own log-axis convention. Narrow log domains
(~2 decades or less) are unchanged, an explicit `yAxisFormat` still applies to
whichever ticks remain labeled, and linear-mode y-axis rendering is untouched. No new
props; `yAxisScale` itself is still unpublished (added in the still-unreleased 1.7.0
line).
